import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../app'

describe('health routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health responde 200 com status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'ok' })
  })

  it('ecoa o x-request-id de correlação (RNF-015)', async () => {
    const provided = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'abc-123' },
    })
    expect(provided.headers['x-request-id']).toBe('abc-123')

    const generated = await app.inject({ method: 'GET', url: '/health' })
    expect(generated.headers['x-request-id']).toBeTruthy()
  })

  it('GET /health/ready responde 200 quando não há checkDb', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'ok' })
  })

  it('GET /health/ready responde 503 quando o checkDb falha', async () => {
    const failing = await buildApp({
      checkDb: async () => {
        throw new Error('db down')
      },
    })
    const res = await failing.inject({ method: 'GET', url: '/health/ready' })
    expect(res.statusCode).toBe(503)
    await failing.close()
  })
})
