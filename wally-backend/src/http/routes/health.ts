import type { FastifyInstance } from 'fastify'

export interface HealthOptions {
  /** Função de readiness (ex.: ping no banco). Ausente = readiness sempre ok. */
  checkDb?: () => Promise<void>
}

/**
 * Health checks:
 * - `GET /health`        → liveness (processo vivo, sem dependências).
 * - `GET /health/ready`  → readiness (dependências, ex.: banco).
 */
export async function healthRoutes(app: FastifyInstance, opts: HealthOptions) {
  app.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
  }))

  app.get('/health/ready', async (_request, reply) => {
    if (!opts.checkDb) return { status: 'ok' }
    try {
      await opts.checkDb()
      return { status: 'ok' }
    } catch (err) {
      app.log.error({ err }, 'readiness check failed')
      reply.code(503)
      return { status: 'unavailable' }
    }
  })
}
