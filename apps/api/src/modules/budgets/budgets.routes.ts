import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  uuid,
  budgetResponse,
  budgetStatus,
  createBudgetBody,
  updateBudgetBody,
  errorResponse,
} from '@wally/contracts'
import { runAsUser } from '../../db/rls'
import {
  createBudget,
  updateBudget,
  deleteBudget,
  listBudgetStatus,
} from './budgets.service'

const idParams = z.object({ id: uuid })

export async function budgetRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const onRequest = [app.authenticate]
  const security = [{ bearerAuth: [] }]

  r.get(
    '/',
    {
      onRequest,
      schema: {
        tags: ['budgets'],
        security,
        response: { 200: z.array(budgetStatus) },
      },
    },
    (request) => runAsUser(request.currentUserId, (tx) => listBudgetStatus(tx)),
  )

  r.post(
    '/',
    {
      onRequest,
      schema: {
        tags: ['budgets'],
        security,
        body: createBudgetBody,
        response: { 201: budgetResponse },
      },
    },
    async (request, reply) => {
      const created = await runAsUser(request.currentUserId, (tx) =>
        createBudget(tx, request.currentUserId, request.body),
      )
      return reply.status(201).send(created)
    },
  )

  r.patch(
    '/:id',
    {
      onRequest,
      schema: {
        tags: ['budgets'],
        security,
        params: idParams,
        body: updateBudgetBody,
        response: { 200: budgetResponse, 404: errorResponse },
      },
    },
    (request) =>
      runAsUser(request.currentUserId, (tx) =>
        updateBudget(tx, request.params.id, request.body),
      ),
  )

  r.delete(
    '/:id',
    {
      onRequest,
      schema: {
        tags: ['budgets'],
        security,
        params: idParams,
        response: { 204: z.null(), 404: errorResponse },
      },
    },
    async (request, reply) => {
      await runAsUser(request.currentUserId, (tx) =>
        deleteBudget(tx, request.params.id),
      )
      return reply.status(204).send(null)
    },
  )
}
