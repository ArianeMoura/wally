import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

/**
 * RF-020 — trilha de auditoria financeira imutável.
 * Toda mutação de saldo (pessoal ou de grupo) emite um evento. Fonte para
 * observabilidade, rastreabilidade LGPD e detecção de padrões pela IA (RF-021).
 * Sem `updated_at`/`deleted_at`: eventos são append-only.
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
