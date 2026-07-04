import { env } from './env'

/**
 * Redação de campos sensíveis nos logs (SECURITY.md §4): nunca registrar
 * senha, tokens, hashes ou o header Authorization.
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
 * Log estruturado (pino) para o Fastify (RNF-015). Dev usa `pino-pretty`;
 * produção emite JSON com redação; testes ficam silenciosos. O Fastify já
 * correlaciona cada linha por `reqId` (ver genReqId em app.ts).
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
