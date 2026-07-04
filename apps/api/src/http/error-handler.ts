import fp from 'fastify-plugin'
import type { FastifyError } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { AppError } from './errors'

/**
 * Error handler central. Nunca vaza stack/PII ao cliente; erros 5xx são logados
 * e respondidos de forma genérica (SECURITY.md §4).
 */
export const errorHandler = fp(function errorHandlerPlugin(app, _opts, done) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Falha de validação da requisição',
      })
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.code,
        message: error.message,
      })
    }

    const statusCode = error.statusCode ?? 500
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'erro não tratado')
      return reply.status(500).send({
        statusCode: 500,
        error: 'INTERNAL',
        message: 'Erro interno do servidor',
      })
    }

    // Erros com status conhecido (JWT 401, rate-limit 429, etc.).
    return reply.status(statusCode).send({
      statusCode,
      error: error.code ?? 'ERROR',
      message: error.message,
    })
  })
  done()
})
