import { env } from './env'

/**
 * Opções de log estruturado (pino) para o Fastify (RNF-015).
 * Em desenvolvimento usa `pino-pretty`; em produção, JSON estruturado.
 */
export const loggerOptions =
  env.NODE_ENV === 'development'
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
        },
      }
    : env.NODE_ENV === 'test'
      ? false
      : { level: 'info' }
