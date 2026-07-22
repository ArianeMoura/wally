import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config/env'
import { UnauthorizedError } from '../http/errors'

type AuthGuard = (request: FastifyRequest, reply: FastifyReply) => Promise<void>

declare module 'fastify' {
  interface FastifyRequest {
    currentUserId: string
  }
  interface FastifyInstance {
    authenticate: AuthGuard
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string }
    user: { sub: string }
  }
}

/**
 * Registers JWT (short-lived access token) and the `authenticate` guard. The
 * payload carries only `sub`, the user id — no PII goes into the token.
 */
export const authPlugin = fp(async function authPluginFn(app) {
  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.ACCESS_TOKEN_TTL },
  })

  app.decorateRequest('currentUserId', '')

  const authenticate: AuthGuard = async (request) => {
    try {
      await request.jwtVerify()
      request.currentUserId = request.user.sub
    } catch {
      throw new UnauthorizedError('Token de acesso inválido ou expirado')
    }
  }

  app.decorate('authenticate', authenticate)
})
