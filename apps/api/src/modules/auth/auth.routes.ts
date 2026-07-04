import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  signUpBody,
  signInBody,
  refreshBody,
  forgotPasswordBody,
  resetPasswordBody,
  authResponse,
  userPublic,
  errorResponse,
} from '@wally/contracts'
import { env } from '../../config/env'
import { AuthService } from './auth.service'

// Limite reforçado contra força bruta em rotas sensíveis (SECURITY.md §2).
const strictRateLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } }

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const service = new AuthService({
    signAccessToken: (userId) => app.jwt.sign({ sub: userId }),
  })

  r.post(
    '/signup',
    {
      schema: {
        tags: ['auth'],
        body: signUpBody,
        response: { 201: authResponse, 409: errorResponse },
      },
    },
    async (request, reply) => {
      const result = await service.signUp(request.body)
      return reply.status(201).send(result)
    },
  )

  r.post(
    '/signin',
    {
      config: strictRateLimit,
      schema: {
        tags: ['auth'],
        body: signInBody,
        response: { 200: authResponse, 401: errorResponse },
      },
    },
    async (request) => service.signIn(request.body),
  )

  r.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        body: refreshBody,
        response: { 200: authResponse, 401: errorResponse },
      },
    },
    async (request) => service.refresh(request.body.refreshToken),
  )

  r.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        body: refreshBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await service.logout(request.body.refreshToken)
      return reply.status(204).send(null)
    },
  )

  r.post(
    '/forgot-password',
    {
      config: strictRateLimit,
      schema: {
        tags: ['auth'],
        body: forgotPasswordBody,
        response: { 200: z.object({ message: z.string() }) },
      },
    },
    async (request) => {
      const token = await service.forgotPassword(request.body.email)
      // Em produção, envie por e-mail. Em dev, logamos para permitir o teste.
      if (token && env.NODE_ENV !== 'production') {
        request.log.info({ resetToken: token }, 'token de redefinição (dev)')
      }
      return {
        message: 'Se o e-mail existir, enviaremos instruções de redefinição.',
      }
    },
  )

  r.post(
    '/reset-password',
    {
      config: strictRateLimit,
      schema: {
        tags: ['auth'],
        body: resetPasswordBody,
        response: { 204: z.null(), 400: errorResponse },
      },
    },
    async (request, reply) => {
      await service.resetPassword(request.body.token, request.body.password)
      return reply.status(204).send(null)
    },
  )

  r.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['auth'],
        security: [{ bearerAuth: [] }],
        response: { 200: userPublic, 401: errorResponse },
      },
    },
    async (request) => service.me(request.currentUserId),
  )
}
