import type { FastifyInstance } from 'fastify'

export interface HealthOptions {
  /** Readiness probe, e.g. a database ping. Omitted means always ready. */
  checkDb?: () => Promise<void>
}

/**
 * Health checks:
 * - `GET /health`       → liveness: the process is up, no dependencies checked.
 * - `GET /health/ready` → readiness: dependencies, such as the database.
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
