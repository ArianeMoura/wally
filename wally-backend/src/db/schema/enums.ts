import { pgEnum } from 'drizzle-orm/pg-core'

export const transactionType = pgEnum('transaction_type', ['income', 'expense'])
export const categoryKind = pgEnum('category_kind', ['income', 'expense'])
export const memberRole = pgEnum('member_role', ['owner', 'member'])
export const budgetPeriod = pgEnum('budget_period', [
  'weekly',
  'monthly',
  'yearly',
])
