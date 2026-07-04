import Fastify, { type FastifyInstance } from 'fastify'
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

export interface BuildAppOptions {
  /** Origem(ns) permitida(s) no CORS. `false` bloqueia cross-origin. */
  corsOrigin?: string | string[] | boolean
  /** Readiness do banco (opcional em testes). */
  checkDb?: () => Promise<void>
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
  }).withTypeProvider<ZodTypeProvider>()

  // Validação e serialização baseadas em esquemas Zod.
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  await app.register(errorHandler)

  await app.register(helmet)
  await app.register(cors, { origin: options.corsOrigin ?? false })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
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

  return app
}
