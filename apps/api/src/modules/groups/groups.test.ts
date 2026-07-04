import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../app'
import { pool, ownerPool } from '../../db/client'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp({ rateLimitMax: 100000 })
  await app.ready()
})

afterAll(async () => {
  await app.close()
  await pool.end()
  await ownerPool.end()
})

interface User {
  auth: { authorization: string }
  id: string
}

async function newUser(): Promise<User> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/signup',
    payload: {
      name: 'Grp',
      email: `grp_${randomUUID()}@wally.test`,
      password: 'segredoForte123',
    },
  })
  const body = res.json()
  return {
    auth: { authorization: `Bearer ${body.accessToken}` },
    id: body.user.id,
  }
}

/** Cria um grupo com 3 membros (A dono, B e C). */
async function groupOfThree(): Promise<{
  a: User
  b: User
  c: User
  groupId: string
}> {
  const [a, b, c] = await Promise.all([newUser(), newUser(), newUser()])
  const created = await app.inject({
    method: 'POST',
    url: '/api/v1/groups',
    headers: a!.auth,
    payload: { name: 'Viagem' },
  })
  const groupId = created.json().id
  for (const m of [b!, c!]) {
    await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/members`,
      headers: a!.auth,
      payload: { userId: m.id },
    })
  }
  return { a: a!, b: b!, c: c!, groupId }
}

function balanceOf(
  body: { balances: { userId: string; balanceCents: number }[] },
  userId: string,
): number {
  return body.balances.find((x) => x.userId === userId)?.balanceCents ?? 0
}

async function getBalances(auth: User['auth'], groupId: string) {
  const res = await app.inject({
    method: 'GET',
    url: `/api/v1/groups/${groupId}/balances`,
    headers: auth,
  })
  return res.json()
}

describe('grupos e membros', () => {
  it('cria grupo com o dono como membro e lista', async () => {
    const a = await newUser()
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/groups',
      headers: a.auth,
      payload: { name: 'Casa' },
    })
    expect(created.statusCode).toBe(201)
    const groupId = created.json().id

    const members = await app.inject({
      method: 'GET',
      url: `/api/v1/groups/${groupId}/members`,
      headers: a.auth,
    })
    expect(members.json()).toHaveLength(1)
    expect(members.json()[0].role).toBe('owner')
  })

  it('só o dono adiciona membros; duplicado retorna 409', async () => {
    const a = await newUser()
    const b = await newUser()
    const groupId = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/groups',
        headers: a.auth,
        payload: { name: 'X' },
      })
    ).json().id

    const add = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/members`,
      headers: a.auth,
      payload: { userId: b.id },
    })
    expect(add.statusCode).toBe(201)

    const dup = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/members`,
      headers: a.auth,
      payload: { userId: b.id },
    })
    expect(dup.statusCode).toBe(409)

    // B (não-dono) tenta adicionar alguém → 403.
    const c = await newUser()
    const forbidden = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/members`,
      headers: b.auth,
      payload: { userId: c.id },
    })
    expect(forbidden.statusCode).toBe(403)
  })
})

describe('despesas, divisão e saldos', () => {
  it('divide R$10,00 por 3 sem perder centavo e mantém Σ saldos == 0', async () => {
    const { a, b, c, groupId } = await groupOfThree()
    const expense = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
      payload: {
        amountCents: 1000,
        description: 'Almoço',
        split: { mode: 'equal', participantIds: [a.id, b.id, c.id] },
      },
    })
    expect(expense.statusCode).toBe(201)
    const shares = expense.json().shares
    expect(
      shares.reduce(
        (s: number, x: { shareCents: number }) => s + x.shareCents,
        0,
      ),
    ).toBe(1000)

    const balances = await getBalances(a.auth, groupId)
    expect(balanceOf(balances, a.id)).toBe(666) // pagou 1000, cota 334
    expect(balanceOf(balances, b.id)).toBe(-333)
    expect(balanceOf(balances, c.id)).toBe(-333)
    expect(
      balances.balances.reduce(
        (s: number, x: { balanceCents: number }) => s + x.balanceCents,
        0,
      ),
    ).toBe(0)
  })

  it('liquidação (settle up) reduz o saldo devedor', async () => {
    const { a, b, c, groupId } = await groupOfThree()
    await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
      payload: {
        amountCents: 900,
        description: 'Uber',
        split: { mode: 'equal', participantIds: [a.id, b.id, c.id] },
      },
    })
    // B paga 300 para A.
    const settle = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/settlements`,
      headers: b.auth,
      payload: { toUserId: a.id, amountCents: 300 },
    })
    expect(settle.statusCode).toBe(201)

    const balances = await getBalances(a.auth, groupId)
    expect(balanceOf(balances, b.id)).toBe(0) // devia 300, pagou 300
    expect(
      balances.balances.reduce(
        (s: number, x: { balanceCents: number }) => s + x.balanceCents,
        0,
      ),
    ).toBe(0)
  })

  it('sugere transferências que zeram o grupo', async () => {
    const { a, b, c, groupId } = await groupOfThree()
    await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
      payload: {
        amountCents: 3000,
        description: 'Mercado',
        split: { mode: 'equal', participantIds: [a.id, b.id, c.id] },
      },
    })
    const balances = await getBalances(a.auth, groupId)
    const transfers = balances.suggestedTransfers
    expect(transfers.length).toBeLessThanOrEqual(2)
    expect(
      transfers.every((t: { amountCents: number }) => t.amountCents > 0),
    ).toBe(true)
  })
})

describe('idempotência (RNF-009)', () => {
  it('mesma Idempotency-Key gera efeito único; corpo diferente com a mesma chave → 409', async () => {
    const { a, b, c, groupId } = await groupOfThree()
    const key = randomUUID()
    const payload = {
      amountCents: 1500,
      description: 'Cinema',
      split: { mode: 'equal', participantIds: [a.id, b.id, c.id] },
    }

    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: { ...a.auth, 'idempotency-key': key },
      payload,
    })
    const second = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: { ...a.auth, 'idempotency-key': key },
      payload,
    })
    expect(first.statusCode).toBe(201)
    expect(second.statusCode).toBe(201)
    expect(second.json().id).toBe(first.json().id) // replay do mesmo registro

    const list = await app.inject({
      method: 'GET',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
    })
    expect(list.json()).toHaveLength(1) // uma única despesa criada

    const conflict = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: { ...a.auth, 'idempotency-key': key },
      payload: { ...payload, amountCents: 9999 },
    })
    expect(conflict.statusCode).toBe(409)
  })
})

describe('isolamento RLS de grupo', () => {
  it('não-membro não vê grupo, despesas nem saldos (404)', async () => {
    const { b, c, groupId } = await groupOfThree()
    const outsider = await newUser()

    const get = await app.inject({
      method: 'GET',
      url: `/api/v1/groups/${groupId}`,
      headers: outsider.auth,
    })
    expect(get.statusCode).toBe(404)

    const balances = await app.inject({
      method: 'GET',
      url: `/api/v1/groups/${groupId}/balances`,
      headers: outsider.auth,
    })
    expect(balances.statusCode).toBe(404)

    // Não-membro não consegue lançar despesa no grupo.
    const expense = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: outsider.auth,
      payload: {
        amountCents: 100,
        description: 'invasão',
        split: { mode: 'equal', participantIds: [b.id, c.id] },
      },
    })
    expect(expense.statusCode).toBe(404)
  })
})

describe('CONCORRÊNCIA — o gate de correção financeira', () => {
  it('N despesas paralelas no mesmo grupo: sem duplicatas e Σ saldos == 0', async () => {
    const { a, b, c, groupId } = await groupOfThree()
    const N = 20

    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        app.inject({
          method: 'POST',
          url: `/api/v1/groups/${groupId}/expenses`,
          headers: a.auth,
          payload: {
            amountCents: 100,
            description: `parallela ${i}`,
            split: { mode: 'equal', participantIds: [a.id, b.id, c.id] },
          },
        }),
      ),
    )
    expect(results.every((r) => r.statusCode === 201)).toBe(true)

    const list = await app.inject({
      method: 'GET',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
    })
    expect(list.json()).toHaveLength(N) // exatamente N, nenhuma perdida/duplicada

    const balances = await getBalances(a.auth, groupId)
    // Cada despesa: A paga 100, cota 34 → +66; B e C → -33 cada.
    expect(balanceOf(balances, a.id)).toBe(66 * N)
    expect(balanceOf(balances, b.id)).toBe(-33 * N)
    expect(balanceOf(balances, c.id)).toBe(-33 * N)
    expect(
      balances.balances.reduce(
        (s: number, x: { balanceCents: number }) => s + x.balanceCents,
        0,
      ),
    ).toBe(0)
  })

  it('N requisições paralelas com a MESMA Idempotency-Key criam UMA só despesa', async () => {
    const { a, b, c, groupId } = await groupOfThree()
    const key = randomUUID()
    const payload = {
      amountCents: 999,
      description: 'idempotente concorrente',
      split: { mode: 'equal', participantIds: [a.id, b.id, c.id] },
    }

    const results = await Promise.all(
      Array.from({ length: 15 }, () =>
        app.inject({
          method: 'POST',
          url: `/api/v1/groups/${groupId}/expenses`,
          headers: { ...a.auth, 'idempotency-key': key },
          payload,
        }),
      ),
    )
    // Todas respondem 201 (a 1ª cria, as demais fazem replay).
    expect(results.every((r) => r.statusCode === 201)).toBe(true)
    const ids = new Set(results.map((r) => r.json().id))
    expect(ids.size).toBe(1)

    const list = await app.inject({
      method: 'GET',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
    })
    expect(list.json()).toHaveLength(1)
  })
})
