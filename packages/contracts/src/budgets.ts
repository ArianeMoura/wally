import { z } from 'zod'
import { uuid, positiveCents, isoDateTime } from './common'

export const budgetPeriod = z.enum(['weekly', 'monthly', 'yearly'])

export const createBudgetBody = z.object({
  categoryId: uuid,
  period: budgetPeriod.default('monthly'),
  limitCents: positiveCents,
})

export const updateBudgetBody = createBudgetBody.partial()

export const budgetResponse = z.object({
  id: uuid,
  userId: uuid,
  categoryId: uuid,
  period: budgetPeriod,
  limitCents: z.number().int(),
  createdAt: isoDateTime,
})

/** RF-019 — estado do orçamento com alerta de estouro. */
export const budgetStatus = budgetResponse.extend({
  spentCents: z.number().int().nonnegative(),
  remainingCents: z.number().int(),
  exceeded: z.boolean(),
})

export type BudgetPeriod = z.infer<typeof budgetPeriod>
export type CreateBudgetBody = z.infer<typeof createBudgetBody>
export type UpdateBudgetBody = z.infer<typeof updateBudgetBody>
export type BudgetResponse = z.infer<typeof budgetResponse>
export type BudgetStatus = z.infer<typeof budgetStatus>
