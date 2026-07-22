import { env } from './env'

/**
 * Redaction of sensitive fields (SECURITY.md §4): passwords, tokens, hashes and
 * the Authorization header must never reach the logs.
 */
const redact = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers["idempotency-key"]',
    'password',
    'passwordHash',
    'accessToken',
    'refreshToken',
    'token',
    'tokenHash',
    '*.password',
    '*.passwordHash',
    '*.accessToken',
    '*.refreshToken',
  ],
  censor: '[REDACTED]',
}

/**
 * Structured logging (RNF-015). Development uses `pino-pretty`, production emits
 * redacted JSON, tests stay silent. Fastify already tags each line with `reqId` —
 * see genReqId in app.ts.
 */
export const loggerOptions =
  env.NODE_ENV === 'development'
    ? {
        level: 'debug',
        redact,
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
        },
      }
    : env.NODE_ENV === 'test'
      ? false
      : { level: 'info', redact }
