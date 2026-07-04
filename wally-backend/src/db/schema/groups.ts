import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
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
export const groupExpenses = pgTable('group_expenses', {
  id: uuid().primaryKey().defaultRandom(),
  groupId: uuid()
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  payerId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
  amountCents: bigint({ mode: 'number' }).notNull(),
  description: text().notNull(),
  occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ...timestamps(),
})

/** Cotas da divisão. Invariante: Σ shareCents == group_expenses.amountCents. */
export const expenseShares = pgTable('expense_shares', {
  id: uuid().primaryKey().defaultRandom(),
  groupExpenseId: uuid()
    .notNull()
    .references(() => groupExpenses.id, { onDelete: 'cascade' }),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  shareCents: bigint({ mode: 'number' }).notNull(),
  ...timestamps(),
})

/** RF-018 — liquidação (settle up) de saldo entre membros. */
export const settlements = pgTable('settlements', {
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
})

export type Group = typeof groups.$inferSelect
export type GroupMember = typeof groupMembers.$inferSelect
export type GroupExpense = typeof groupExpenses.$inferSelect
export type ExpenseShare = typeof expenseShares.$inferSelect
export type Settlement = typeof settlements.$inferSelect
