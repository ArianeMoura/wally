import { pgTable, uuid, text, bigint, timestamp } from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'
import { users } from './users'
import { transactionType, categoryKind, budgetPeriod } from './enums'

/** RF-017 — categorias (user_id nulo = categoria padrão do sistema). */
export const categories = pgTable('categories', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  icon: text(),
  color: text(),
  kind: categoryKind().notNull(),
  ...timestamps(),
})

/** Finanças pessoais. Valores em inteiros de centavos (RNF-010). */
export const transactions = pgTable('transactions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
  type: transactionType().notNull(),
  amountCents: bigint({ mode: 'number' }).notNull(),
  description: text().notNull(),
  occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ...timestamps(),
})

/** RF-019 — orçamentos/metas por categoria. */
export const budgets = pgTable('budgets', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid()
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  period: budgetPeriod().notNull().default('monthly'),
  limitCents: bigint({ mode: 'number' }).notNull(),
  ...timestamps(),
})

export type Category = typeof categories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Budget = typeof budgets.$inferSelect
