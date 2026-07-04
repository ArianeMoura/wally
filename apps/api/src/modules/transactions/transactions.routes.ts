import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  uuid,
  isoDateTime,
  paginated,
  transactionResponse,
  balanceSummary,
  listTransactionsQuery,
  createTransactionBody,
  updateTransactionBody,
  errorResponse,
} from '@wally/contracts'
import { runAsUser } from '../../db/rls'
import {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  balanceSummaryFor,
} from './transactions.service'

const idParams = z.object({ id: uuid })
const summaryQuery = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
})

export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const onRequest = [app.authenticate]
  const security = [{ bearerAuth: [] }]

  r.get(
    '/',
    {
      onRequest,
      schema: {
        tags: ['transactions'],
        security,
        querystring: listTransactionsQuery,
        response: { 200: paginated(transactionResponse) },
      },
    },
    (request) =>
      runAsUser(request.currentUserId, (tx) =>
        listTransactions(tx, request.query),
      ),
  )

  r.get(
    '/summary',
    {
      onRequest,
      schema: {
        tags: ['transactions'],
        security,
        querystring: summaryQuery,
        response: { 200: balanceSummary },
      },
    },
    (request) =>
      runAsUser(request.currentUserId, (tx) =>
        balanceSummaryFor(
          tx,
          request.query.from ? new Date(request.query.from) : undefined,
          request.query.to ? new Date(request.query.to) : undefined,
        ),
      ),
  )

  r.post(
    '/',
    {
      onRequest,
      schema: {
        tags: ['transactions'],
        security,
        body: createTransactionBody,
        response: { 201: transactionResponse },
      },
    },
    async (request, reply) => {
      const created = await runAsUser(request.currentUserId, (tx) =>
        createTransaction(tx, request.currentUserId, request.body),
      )
      return reply.status(201).send(created)
    },
  )

  r.patch(
    '/:id',
    {
      onRequest,
      schema: {
        tags: ['transactions'],
        security,
        params: idParams,
        body: updateTransactionBody,
        response: { 200: transactionResponse, 404: errorResponse },
      },
    },
    (request) =>
      runAsUser(request.currentUserId, (tx) =>
        updateTransaction(
          tx,
          request.currentUserId,
          request.params.id,
          request.body,
        ),
      ),
  )

  r.delete(
    '/:id',
    {
      onRequest,
      schema: {
        tags: ['transactions'],
        security,
        params: idParams,
        response: { 204: z.null(), 404: errorResponse },
      },
    },
    async (request, reply) => {
      await runAsUser(request.currentUserId, (tx) =>
        deleteTransaction(tx, request.currentUserId, request.params.id),
      )
      return reply.status(204).send(null)
    },
  )
}
