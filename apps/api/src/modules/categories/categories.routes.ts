import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  uuid,
  categoryResponse,
  createCategoryBody,
  updateCategoryBody,
  errorResponse,
} from '@wally/contracts'
import { runAsUser } from '../../db/rls'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.service'

const idParams = z.object({ id: uuid })

export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const secured = {
    onRequest: [app.authenticate],
    security: [{ bearerAuth: [] }],
  }

  r.get(
    '/',
    {
      onRequest: secured.onRequest,
      schema: {
        tags: ['categories'],
        security: secured.security,
        response: { 200: z.array(categoryResponse) },
      },
    },
    (request) => runAsUser(request.currentUserId, (tx) => listCategories(tx)),
  )

  r.post(
    '/',
    {
      onRequest: secured.onRequest,
      schema: {
        tags: ['categories'],
        security: secured.security,
        body: createCategoryBody,
        response: { 201: categoryResponse },
      },
    },
    async (request, reply) => {
      const created = await runAsUser(request.currentUserId, (tx) =>
        createCategory(tx, request.currentUserId, request.body),
      )
      return reply.status(201).send(created)
    },
  )

  r.patch(
    '/:id',
    {
      onRequest: secured.onRequest,
      schema: {
        tags: ['categories'],
        security: secured.security,
        params: idParams,
        body: updateCategoryBody,
        response: { 200: categoryResponse, 404: errorResponse },
      },
    },
    (request) =>
      runAsUser(request.currentUserId, (tx) =>
        updateCategory(tx, request.params.id, request.body),
      ),
  )

  r.delete(
    '/:id',
    {
      onRequest: secured.onRequest,
      schema: {
        tags: ['categories'],
        security: secured.security,
        params: idParams,
        response: { 204: z.null(), 404: errorResponse },
      },
    },
    async (request, reply) => {
      await runAsUser(request.currentUserId, (tx) =>
        deleteCategory(tx, request.params.id),
      )
      return reply.status(204).send(null)
    },
  )
}
