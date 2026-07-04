import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { loggerOptions } from './config/logger'
import { healthRoutes } from './http/routes/health'
import { errorHandler } from './http/error-handler'
import { authPlugin } from './plugins/auth'
import { authRoutes } from './modules/auth/auth.routes'
import { categoryRoutes } from './modules/categories/categories.routes'
import { transactionRoutes } from './modules/transactions/transactions.routes'
import { budgetRoutes } from './modules/budgets/budgets.routes'
import { groupRoutes } from './modules/groups/groups.routes'
import { auditRoutes } from './modules/audit/audit.routes'

export interface BuildAppOptions {
  /** Origem(ns) permitida(s) no CORS. `false` bloqueia cross-origin. */
  corsOrigin?: string | string[] | boolean
  /** Readiness do banco (opcional em testes). */
  checkDb?: () => Promise<void>
  /** Teto global de rate limit por minuto (default 100). Alto em testes. */
  rateLimitMax?: number
}

/**
 * Monta a aplicação Fastify com validação Zod ponta-a-ponta, hardening
 * (helmet, rate-limit, CORS restrito), OpenAPI e health checks.
 * Não faz `listen` — isso fica em `server.ts` (testável via `app.inject`).
 */
export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerOptions,
    // Correlação (RNF-015): honra x-request-id de entrada ou gera um UUID.
    genReqId: (req) => {
      const header = req.headers['x-request-id']
      return typeof header === 'string' && header.length > 0
        ? header
        : randomUUID()
    },
  }).withTypeProvider<ZodTypeProvider>()

  // Ecoa o id de correlação na resposta.
  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id)
  })

  // Validação e serialização baseadas em esquemas Zod.
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  await app.register(errorHandler)

  await app.register(helmet)
  await app.register(cors, { origin: options.corsOrigin ?? false })
  await app.register(rateLimit, {
    max: options.rateLimitMax ?? 100,
    timeWindow: '1 minute',
  })
  await app.register(authPlugin)

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Wally API',
        description: 'API do Wally 2.0',
        version: '2.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/wally/documentation' })

  await app.register(healthRoutes, { checkDb: options.checkDb })
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' })
  await app.register(transactionRoutes, { prefix: '/api/v1/transactions' })
  await app.register(budgetRoutes, { prefix: '/api/v1/budgets' })
  await app.register(groupRoutes, { prefix: '/api/v1/groups' })
  await app.register(auditRoutes, { prefix: '/api/v1/events' })

  return app
}
