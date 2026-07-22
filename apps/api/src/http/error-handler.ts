import fp from 'fastify-plugin'
import type { FastifyError } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { AppError } from './errors'

/**
 * Central error handler. Never leaks a stack trace or PII to the client; 5xx
 * errors are logged and answered generically (SECURITY.md §4).
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

    // Errors that already carry a status (JWT 401, rate-limit 429, …).
    return reply.status(statusCode).send({
      statusCode,
      error: error.code ?? 'ERROR',
      message: error.message,
    })
  })
  done()
})
