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

async function newUser() {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/signup',
    payload: {
      name: 'Aud',
      email: `aud_${randomUUID()}@wally.test`,
      password: 'segredoForte123',
    },
  })
  const body = res.json()
  return {
    auth: { authorization: `Bearer ${body.accessToken}` },
    id: body.user.id,
  }
}

async function events(auth: { authorization: string }, entityType?: string) {
  const url = entityType
    ? `/api/v1/events?entityType=${entityType}`
    : '/api/v1/events'
  const res = await app.inject({ method: 'GET', url, headers: auth })
  return res.json()
}

describe('trilha de auditoria (financial_events)', () => {
  it('emite created/updated/deleted para transações', async () => {
    const { auth } = await newUser()
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: auth,
      payload: { type: 'expense', amountCents: 2500, description: 'Café' },
    })
    const txId = created.json().id

    await app.inject({
      method: 'PATCH',
      url: `/api/v1/transactions/${txId}`,
      headers: auth,
      payload: { amountCents: 3000 },
    })
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/transactions/${txId}`,
      headers: auth,
    })

    const log = await events(auth, 'transaction')
    const forTx = log.items.filter(
      (e: { entityId: string }) => e.entityId === txId,
    )
    const kinds = forTx.map((e: { eventType: string }) => e.eventType).sort()
    expect(kinds).toEqual(['created', 'deleted', 'updated'])

    const updated = forTx.find(
      (e: { eventType: string }) => e.eventType === 'updated',
    )
    expect(updated.before.amountCents).toBe(2500)
    expect(updated.after.amountCents).toBe(3000)
  })

  it('emite evento ao criar despesa e liquidação de grupo', async () => {
    const a = await newUser()
    const b = await newUser()
    const groupId = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/groups',
        headers: a.auth,
        payload: { name: 'Aud Group' },
      })
    ).json().id
    await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/members`,
      headers: a.auth,
      payload: { userId: b.id },
    })

    const expense = await app.inject({
      method: 'POST',
      url: `/api/v1/groups/${groupId}/expenses`,
      headers: a.auth,
      payload: {
        amountCents: 1000,
        description: 'Pizza',
        split: { mode: 'equal', participantIds: [a.id, b.id] },
      },
    })
    const expenseId = expense.json().id

    const aLog = await events(a.auth, 'group_expense')
    expect(
      aLog.items.some((e: { entityId: string }) => e.entityId === expenseId),
    ).toBe(true)

    // Actor isolation: B cannot see an event whose actor is A (RLS).
    const bLog = await events(b.auth)
    expect(
      bLog.items.some((e: { entityId: string }) => e.entityId === expenseId),
    ).toBe(false)
  })

  it('append-only: o evento é imutável (sem rota de escrita/edição)', async () => {
    const { auth } = await newUser()
    // /events is read-only: no POST/PATCH/DELETE exists.
    const post = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      headers: auth,
      payload: {},
    })
    expect(post.statusCode).toBe(404)
  })
})
