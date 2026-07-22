import { and, desc, eq, count, type SQL } from 'drizzle-orm'
import type { FinancialEventResponse, ListEventsQuery } from '@wally/contracts'
import type { Tx } from '../../db/rls'
import { financialEvents } from '../../db/schema/audit'

export type EntityType = 'transaction' | 'group_expense' | 'settlement'
export type EventType = 'created' | 'updated' | 'deleted'

type EventRow = typeof financialEvents.$inferSelect

function toResponse(e: EventRow): FinancialEventResponse {
  return {
    id: e.id,
    actorId: e.actorId ?? null,
    entityType: e.entityType,
    entityId: e.entityId,
    eventType: e.eventType,
    before: (e.before as Record<string, unknown> | null) ?? null,
    after: (e.after as Record<string, unknown> | null) ?? null,
    occurredAt: e.occurredAt.toISOString(),
  }
}

/**
 * RF-020 — appends an immutable balance-mutation event inside the SAME
 * transaction as the operation, so the two commit together. `actorId` being the
 * current user is what satisfies RLS on `financial_events`. Backs LGPD
 * traceability and time-series AI.
 */
export async function emitFinancialEvent(
  tx: Tx,
  event: {
    actorId: string
    entityType: EntityType
    entityId: string
    eventType: EventType
    before?: unknown
    after?: unknown
  },
): Promise<void> {
  await tx.insert(financialEvents).values({
    actorId: event.actorId,
    entityType: event.entityType,
    entityId: event.entityId,
    eventType: event.eventType,
    before: event.before ?? null,
    after: event.after ?? null,
  })
}

export async function listEvents(
  tx: Tx,
  query: ListEventsQuery,
): Promise<{
  items: FinancialEventResponse[]
  page: number
  pageSize: number
  total: number
}> {
  const conditions: SQL[] = []
  if (query.entityType) {
    conditions.push(eq(financialEvents.entityType, query.entityType))
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined
  const offset = (query.page - 1) * query.pageSize

  const [rows, [totalRow]] = await Promise.all([
    tx
      .select()
      .from(financialEvents)
      .where(where)
      .orderBy(desc(financialEvents.occurredAt))
      .limit(query.pageSize)
      .offset(offset),
    tx.select({ value: count() }).from(financialEvents).where(where),
  ])

  return {
    items: rows.map(toResponse),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow?.value ?? 0,
  }
}
