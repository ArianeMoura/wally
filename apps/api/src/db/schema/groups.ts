import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  timestamp,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { timestamps } from './_helpers'
import { users } from './users'
import { categories } from './finance'
import { memberRole } from './enums'

export const groups = pgTable('groups', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  ownerId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  // Optimistic concurrency: bumped on every balance mutation (RNF-008).
  version: integer().notNull().default(0),
  ...timestamps(),
})

export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: memberRole().notNull().default('member'),
    ...timestamps(),
  },
  (t) => [unique().on(t.groupId, t.userId)],
)

/** RF-011 — group expense. Amount in cents (RNF-010). */
export const groupExpenses = pgTable(
  'group_expenses',
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    payerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    categoryId: uuid().references(() => categories.id, {
      onDelete: 'set null',
    }),
    amountCents: bigint({ mode: 'number' }).notNull(),
    description: text().notNull(),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps(),
  },
  (t) => [check('group_expenses_amount_positive', sql`${t.amountCents} > 0`)],
)

/** Split shares. Invariant: Σ shareCents == group_expenses.amountCents. */
export const expenseShares = pgTable(
  'expense_shares',
  {
    id: uuid().primaryKey().defaultRandom(),
    groupExpenseId: uuid()
      .notNull()
      .references(() => groupExpenses.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    shareCents: bigint({ mode: 'number' }).notNull(),
    ...timestamps(),
  },
  (t) => [
    // A share is never negative; the sum == total check happens in the transaction.
    check('expense_shares_non_negative', sql`${t.shareCents} >= 0`),
    unique().on(t.groupExpenseId, t.userId),
  ],
)

/** RF-018 — settling a balance between two members. */
export const settlements = pgTable(
  'settlements',
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    fromUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    toUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    amountCents: bigint({ mode: 'number' }).notNull(),
    settledAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps(),
  },
  (t) => [
    check('settlements_amount_positive', sql`${t.amountCents} > 0`),
    // Settling with yourself is meaningless.
    check(
      'settlements_distinct_parties',
      sql`${t.fromUserId} <> ${t.toUserId}`,
    ),
  ],
)

export type Group = typeof groups.$inferSelect
export type GroupMember = typeof groupMembers.$inferSelect
export type GroupExpense = typeof groupExpenses.$inferSelect
export type ExpenseShare = typeof expenseShares.$inferSelect
export type Settlement = typeof settlements.$inferSelect
