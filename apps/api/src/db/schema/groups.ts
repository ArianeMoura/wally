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
  // Concorrência otimista: incrementado a cada mutação de saldo (RNF-008).
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

/** RF-011 — despesa de grupo. Valor em centavos (RNF-010). */
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

/** Cotas da divisão. Invariante: Σ shareCents == group_expenses.amountCents. */
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
    // Cota nunca negativa; a soma == total é verificada na transação (F6).
    check('expense_shares_non_negative', sql`${t.shareCents} >= 0`),
    unique().on(t.groupExpenseId, t.userId),
  ],
)

/** RF-018 — liquidação (settle up) de saldo entre membros. */
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
    // Não faz sentido liquidar consigo mesmo.
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
