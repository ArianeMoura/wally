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

/** Creates a user and returns the authorization header. */
async function newUser(): Promise<{
  auth: { authorization: string }
  id: string
}> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/signup',
    payload: {
      name: 'Fin',
      email: `fin_${randomUUID()}@wally.test`,
      password: 'segredoForte123',
    },
  })
  const body = res.json()
  return {
    auth: { authorization: `Bearer ${body.accessToken}` },
    id: body.user.id,
  }
}

describe('categories', () => {
  it('lista os padrões do sistema e permite criar a própria', async () => {
    const { auth } = await newUser()
    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/categories',
      headers: auth,
    })
    expect(list.statusCode).toBe(200)
    const defaults = list.json()
    expect(defaults.length).toBeGreaterThanOrEqual(15)
    expect(
      defaults.some((c: { userId: string | null }) => c.userId === null),
    ).toBe(true)

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/categories',
      headers: auth,
      payload: { name: 'Pet', icon: 'paw', color: '#123456', kind: 'expense' },
    })
    expect(created.statusCode).toBe(201)
    expect(created.json().userId).toBeTruthy()
  })

  it('não vaza categoria privada de um usuário para outro (RLS)', async () => {
    const a = await newUser()
    const b = await newUser()
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/categories',
      headers: a.auth,
      payload: { name: `Secreta_${randomUUID()}`, kind: 'expense' },
    })
    const name = created.json().name

    const bList = await app.inject({
      method: 'GET',
      url: '/api/v1/categories',
      headers: b.auth,
    })
    expect(bList.json().some((c: { name: string }) => c.name === name)).toBe(
      false,
    )
  })
})

describe('transactions + saldo', () => {
  it('cria receitas/despesas e calcula o saldo do período', async () => {
    const { auth } = await newUser()
    await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: auth,
      payload: { type: 'income', amountCents: 10000, description: 'Salário' },
    })
    await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: auth,
      payload: { type: 'expense', amountCents: 3000, description: 'Mercado' },
    })

    const summary = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions/summary',
      headers: auth,
    })
    expect(summary.statusCode).toBe(200)
    expect(summary.json()).toEqual({
      incomeCents: 10000,
      expenseCents: 3000,
      balanceCents: 7000,
    })
  })

  it('extrato paginado e filtro por tipo', async () => {
    const { auth } = await newUser()
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/transactions',
        headers: auth,
        payload: {
          type: 'expense',
          amountCents: 100 + i,
          description: `x${i}`,
        },
      })
    }
    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions?type=expense&pageSize=2',
      headers: auth,
    })
    expect(list.statusCode).toBe(200)
    const body = list.json()
    expect(body.total).toBe(3)
    expect(body.items.length).toBe(2)
    expect(
      body.items.every((t: { type: string }) => t.type === 'expense'),
    ).toBe(true)
  })

  it('isolamento RLS: B não vê, não edita e não apaga a transação de A', async () => {
    const a = await newUser()
    const b = await newUser()
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: a.auth,
      payload: {
        type: 'expense',
        amountCents: 5000,
        description: 'Privado de A',
      },
    })
    const txId = created.json().id

    const bList = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions',
      headers: b.auth,
    })
    expect(bList.json().items.some((t: { id: string }) => t.id === txId)).toBe(
      false,
    )

    const bPatch = await app.inject({
      method: 'PATCH',
      url: `/api/v1/transactions/${txId}`,
      headers: b.auth,
      payload: { amountCents: 1 },
    })
    expect(bPatch.statusCode).toBe(404)

    const bDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/transactions/${txId}`,
      headers: b.auth,
    })
    expect(bDelete.statusCode).toBe(404)

    // A can still delete their own.
    const aDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/transactions/${txId}`,
      headers: a.auth,
    })
    expect(aDelete.statusCode).toBe(204)
  })
})

describe('budgets', () => {
  it('calcula gasto do período e sinaliza estouro', async () => {
    const { auth } = await newUser()
    const cat = await app.inject({
      method: 'POST',
      url: '/api/v1/categories',
      headers: auth,
      payload: { name: 'Lazer', kind: 'expense' },
    })
    const categoryId = cat.json().id

    await app.inject({
      method: 'POST',
      url: '/api/v1/budgets',
      headers: auth,
      payload: { categoryId, period: 'monthly', limitCents: 5000 },
    })
    await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: auth,
      payload: {
        type: 'expense',
        amountCents: 3000,
        description: 'Cinema',
        categoryId,
      },
    })

    let status = await app.inject({
      method: 'GET',
      url: '/api/v1/budgets',
      headers: auth,
    })
    let b = status.json()[0]
    expect(b.spentCents).toBe(3000)
    expect(b.remainingCents).toBe(2000)
    expect(b.exceeded).toBe(false)

    await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: auth,
      payload: {
        type: 'expense',
        amountCents: 3000,
        description: 'Show',
        categoryId,
      },
    })
    status = await app.inject({
      method: 'GET',
      url: '/api/v1/budgets',
      headers: auth,
    })
    b = status.json()[0]
    expect(b.spentCents).toBe(6000)
    expect(b.exceeded).toBe(true)
  })
})
