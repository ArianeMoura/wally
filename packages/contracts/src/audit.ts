import { z } from 'zod'
import { uuid, isoDateTime, paginationQuery } from './common'

/** RF-020 — an immutable entry in the financial audit trail. */
export const financialEventResponse = z.object({
  id: uuid,
  actorId: uuid.nullable(),
  entityType: z.string(), // 'transaction' | 'group_expense' | 'settlement'
  entityId: uuid,
  eventType: z.string(), // 'created' | 'updated' | 'deleted'
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  occurredAt: isoDateTime,
})

export const listEventsQuery = paginationQuery.extend({
  entityType: z.string().optional(),
})

export type FinancialEventResponse = z.infer<typeof financialEventResponse>
export type ListEventsQuery = z.infer<typeof listEventsQuery>
