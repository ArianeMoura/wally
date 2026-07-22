import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

/**
 * RF-020 — immutable financial audit trail. Every balance mutation, personal or
 * group, emits an event. It backs observability, LGPD traceability and AI
 * pattern detection (RF-021). No `updated_at`/`deleted_at`: events are
 * append-only.
 */
export const financialEvents = pgTable('financial_events', {
  id: uuid().primaryKey().defaultRandom(),
  actorId: uuid().references(() => users.id, { onDelete: 'set null' }),
  entityType: text().notNull(), // 'transaction' | 'group_expense' | 'settlement' | ...
  entityId: uuid().notNull(),
  eventType: text().notNull(), // 'created' | 'updated' | 'deleted' | 'settled' | ...
  before: jsonb(),
  after: jsonb(),
  occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type FinancialEvent = typeof financialEvents.$inferSelect
