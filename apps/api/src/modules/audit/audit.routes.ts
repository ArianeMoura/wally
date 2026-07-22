import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  paginated,
  financialEventResponse,
  listEventsQuery,
} from '@wally/contracts'
import { runAsUser } from '../../db/rls'
import { listEvents } from './audit.service'

/** RF-020 — the user's audit history; RLS scopes it to their own events. */
export async function auditRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>()

  r.get(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['audit'],
        security: [{ bearerAuth: [] }],
        querystring: listEventsQuery,
        response: { 200: paginated(financialEventResponse) },
      },
    },
    (request) =>
      runAsUser(request.currentUserId, (tx) => listEvents(tx, request.query)),
  )
}
