import { z } from 'zod'
import {
  uuid,
  positiveCents,
  isoDateTime,
  paginationQuery,
} from './common'

export const transactionType = z.enum(['income', 'expense'])

export const createTransactionBody = z.object({
  type: transactionType,
  amountCents: positiveCents,
  description: z.string().min(1).max(200),
  categoryId: uuid.optional(),
  occurredAt: isoDateTime.optional(),
})

export const updateTransactionBody = createTransactionBody.partial()

export const listTransactionsQuery = paginationQuery.extend({
  type: transactionType.optional(),
  categoryId: uuid.optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  search: z.string().max(200).optional(),
})

export const transactionResponse = z.object({
  id: uuid,
  userId: uuid,
  type: transactionType,
  amountCents: z.number().int(),
  description: z.string(),
  categoryId: uuid.nullable(),
  occurredAt: isoDateTime,
  createdAt: isoDateTime,
})

/** RF-008 — resumo do período (saldo automático). */
export const balanceSummary = z.object({
  incomeCents: z.number().int().nonnegative(),
  expenseCents: z.number().int().nonnegative(),
  balanceCents: z.number().int(),
})

export type TransactionType = z.infer<typeof transactionType>
export type CreateTransactionBody = z.infer<typeof createTransactionBody>
export type UpdateTransactionBody = z.infer<typeof updateTransactionBody>
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuery>
export type TransactionResponse = z.infer<typeof transactionResponse>
export type BalanceSummary = z.infer<typeof balanceSummary>
