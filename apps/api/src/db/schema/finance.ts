import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { timestamps } from './_helpers'
import { users } from './users'
import { transactionType, categoryKind, budgetPeriod } from './enums'

/** RF-017 — categories; a null user_id marks a system default. */
export const categories = pgTable('categories', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  icon: text(),
  color: text(),
  kind: categoryKind().notNull(),
  ...timestamps(),
})

/** Personal finances. Amounts are integer cents (RNF-010). */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid().references(() => categories.id, {
      onDelete: 'set null',
    }),
    type: transactionType().notNull(),
    amountCents: bigint({ mode: 'number' }).notNull(),
    description: text().notNull(),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps(),
  },
  (t) => [
    // Amounts are always positive; the sign comes from `type` (RNF-010).
    check('transactions_amount_positive', sql`${t.amountCents} > 0`),
  ],
)

/** RF-019 — per-category budgets and goals. */
export const budgets = pgTable(
  'budgets',
  {
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
  },
  (t) => [check('budgets_limit_non_negative', sql`${t.limitCents} >= 0`)],
)

export type Category = typeof categories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Budget = typeof budgets.$inferSelect
