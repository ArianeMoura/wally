import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  uuid,
  createGroupBody,
  groupResponse,
  addMemberBody,
  groupMemberResponse,
  createExpenseBody,
  expenseResponse,
  createSettlementBody,
  settlementResponse,
  groupBalancesResponse,
  errorResponse,
} from '@wally/contracts'
import {
  createGroup,
  listGroups,
  getGroup,
  listMembers,
  addMember,
  removeMember,
} from './groups.service'
import {
  createExpense,
  createSettlement,
  listExpenses,
  getBalances,
} from './ledger.service'

const groupParams = z.object({ id: uuid })
const memberParams = z.object({ id: uuid, userId: uuid })

function idempotencyKeyOf(request: FastifyRequest): string | undefined {
  const value = request.headers['idempotency-key']
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export async function groupRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const onRequest = [app.authenticate]
  const security = [{ bearerAuth: [] }]
  const tags = ['groups']

  r.post(
    '/',
    {
      onRequest,
      schema: {
        tags,
        security,
        body: createGroupBody,
        response: { 201: groupResponse },
      },
    },
    async (request, reply) => {
      const group = await createGroup(request.currentUserId, request.body)
      return reply.status(201).send(group)
    },
  )

  r.get(
    '/',
    {
      onRequest,
      schema: { tags, security, response: { 200: z.array(groupResponse) } },
    },
    (request) => listGroups(request.currentUserId),
  )

  r.get(
    '/:id',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        response: { 200: groupResponse, 404: errorResponse },
      },
    },
    (request) => getGroup(request.currentUserId, request.params.id),
  )

  // ---- Members -------------------------------------------------------------
  r.get(
    '/:id/members',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        response: { 200: z.array(groupMemberResponse), 404: errorResponse },
      },
    },
    (request) => listMembers(request.currentUserId, request.params.id),
  )

  r.post(
    '/:id/members',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        body: addMemberBody,
        response: {
          201: groupMemberResponse,
          403: errorResponse,
          404: errorResponse,
          409: errorResponse,
        },
      },
    },
    async (request, reply) => {
      const member = await addMember(
        request.currentUserId,
        request.params.id,
        request.body,
      )
      return reply.status(201).send(member)
    },
  )

  r.delete(
    '/:id/members/:userId',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: memberParams,
        response: { 204: z.null(), 403: errorResponse, 404: errorResponse },
      },
    },
    async (request, reply) => {
      await removeMember(
        request.currentUserId,
        request.params.id,
        request.params.userId,
      )
      return reply.status(204).send(null)
    },
  )

  // ---- Expenses / Settlements / Balances -----------------------------------
  r.post(
    '/:id/expenses',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        body: createExpenseBody,
        response: {
          201: expenseResponse,
          400: errorResponse,
          404: errorResponse,
          409: errorResponse,
        },
      },
    },
    async (request, reply) => {
      const expense = await createExpense(
        request.currentUserId,
        request.params.id,
        request.body,
        idempotencyKeyOf(request),
      )
      return reply.status(201).send(expense)
    },
  )

  r.get(
    '/:id/expenses',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        response: { 200: z.array(expenseResponse) },
      },
    },
    (request) => listExpenses(request.currentUserId, request.params.id),
  )

  r.post(
    '/:id/settlements',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        body: createSettlementBody,
        response: {
          201: settlementResponse,
          400: errorResponse,
          404: errorResponse,
          409: errorResponse,
        },
      },
    },
    async (request, reply) => {
      const settlement = await createSettlement(
        request.currentUserId,
        request.params.id,
        request.body,
        idempotencyKeyOf(request),
      )
      return reply.status(201).send(settlement)
    },
  )

  r.get(
    '/:id/balances',
    {
      onRequest,
      schema: {
        tags,
        security,
        params: groupParams,
        response: { 200: groupBalancesResponse, 404: errorResponse },
      },
    },
    (request) => getBalances(request.currentUserId, request.params.id),
  )
}
