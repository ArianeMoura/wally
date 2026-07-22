import { z } from 'zod'
import { uuid, positiveCents, nonNegativeCents, isoDateTime } from './common'

export const memberRole = z.enum(['owner', 'member'])

export const createGroupBody = z.object({
  name: z.string().min(1).max(80),
})

export const groupResponse = z.object({
  id: uuid,
  name: z.string(),
  ownerId: uuid,
  version: z.number().int().nonnegative(),
  createdAt: isoDateTime,
})

export const addMemberBody = z.object({
  userId: uuid,
  role: memberRole.default('member'),
})

export const groupMemberResponse = z.object({
  id: uuid,
  groupId: uuid,
  userId: uuid,
  role: memberRole,
  createdAt: isoDateTime,
})

/**
 * How to split an expense. The server always reconciles the final sum with the
 * largest remainder method (@wally/core), enforcing `Σ shares == amount`.
 *   • equal   — evenly across participants
 *   • weights — proportional to integer weights
 *   • shares  — explicit shares in cents, validated against the total
 */
export const splitSpec = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('equal'),
    participantIds: z.array(uuid).min(1),
  }),
  z.object({
    mode: z.literal('weights'),
    weights: z
      .array(z.object({ userId: uuid, weight: z.number().int().positive() }))
      .min(1),
  }),
  z.object({
    mode: z.literal('shares'),
    shares: z
      .array(z.object({ userId: uuid, shareCents: nonNegativeCents }))
      .min(1),
  }),
])

export const createExpenseBody = z.object({
  amountCents: positiveCents,
  description: z.string().min(1).max(200),
  categoryId: uuid.optional(),
  occurredAt: isoDateTime.optional(),
  /** Payer; defaults to the authenticated user. */
  payerId: uuid.optional(),
  split: splitSpec,
})

export const expenseShareResponse = z.object({
  userId: uuid,
  shareCents: z.number().int(),
})

export const expenseResponse = z.object({
  id: uuid,
  groupId: uuid,
  payerId: uuid,
  amountCents: z.number().int(),
  description: z.string(),
  categoryId: uuid.nullable(),
  occurredAt: isoDateTime,
  createdAt: isoDateTime,
  shares: z.array(expenseShareResponse),
})

/** RF-018 — record a settlement. */
export const createSettlementBody = z.object({
  /** Payer; defaults to the authenticated user. */
  fromUserId: uuid.optional(),
  toUserId: uuid,
  amountCents: positiveCents,
})

export const settlementResponse = z.object({
  id: uuid,
  groupId: uuid,
  fromUserId: uuid,
  toUserId: uuid,
  amountCents: z.number().int(),
  settledAt: isoDateTime,
})

export const memberBalance = z.object({
  userId: uuid,
  balanceCents: z.number().int(), // >0 credor, <0 devedor
})

export const transfer = z.object({
  fromUserId: uuid,
  toUserId: uuid,
  amountCents: z.number().int().positive(),
})

/** RF-012/018 — group balances plus a suggested settlement. */
export const groupBalancesResponse = z.object({
  balances: z.array(memberBalance),
  suggestedTransfers: z.array(transfer),
})

export type MemberRole = z.infer<typeof memberRole>
export type CreateGroupBody = z.infer<typeof createGroupBody>
export type GroupResponse = z.infer<typeof groupResponse>
export type AddMemberBody = z.infer<typeof addMemberBody>
export type GroupMemberResponse = z.infer<typeof groupMemberResponse>
export type SplitSpec = z.infer<typeof splitSpec>
export type CreateExpenseBody = z.infer<typeof createExpenseBody>
export type ExpenseResponse = z.infer<typeof expenseResponse>
export type CreateSettlementBody = z.infer<typeof createSettlementBody>
export type SettlementResponse = z.infer<typeof settlementResponse>
export type MemberBalance = z.infer<typeof memberBalance>
export type Transfer = z.infer<typeof transfer>
export type GroupBalancesResponse = z.infer<typeof groupBalancesResponse>
