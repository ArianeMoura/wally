import { splitByLargestRemainder, MoneyError } from '@wally/core'
import type { SplitSpec } from '@wally/contracts'
import { BadRequestError } from '../../http/errors'

export interface ResolvedShare {
  userId: string
  shareCents: number
}

/**
 * Turns the client's split spec into exact shares, always reconciled on the
 * server by largest remainder (@wally/core). Enforces `Σ shares == amountCents`
 * and checks every participant is a member.
 */
export function resolveSplit(
  split: SplitSpec,
  amountCents: number,
  activeMemberIds: Set<string>,
): ResolvedShare[] {
  const ensureMembers = (ids: string[]): void => {
    for (const id of ids) {
      if (!activeMemberIds.has(id)) {
        throw new BadRequestError(
          `participante ${id} não é membro ativo do grupo`,
        )
      }
    }
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestError('participantes duplicados na divisão')
    }
  }

  if (split.mode === 'equal') {
    ensureMembers(split.participantIds)
    const cents = safeSplit(
      amountCents,
      split.participantIds.map(() => 1),
    )
    return split.participantIds.map((userId, i) => ({
      userId,
      shareCents: cents[i]!,
    }))
  }

  if (split.mode === 'weights') {
    const ids = split.weights.map((w) => w.userId)
    ensureMembers(ids)
    const cents = safeSplit(
      amountCents,
      split.weights.map((w) => w.weight),
    )
    return split.weights.map((w, i) => ({
      userId: w.userId,
      shareCents: cents[i]!,
    }))
  }

  // mode === 'shares' — explicit shares, checked to add up exactly.
  const ids = split.shares.map((s) => s.userId)
  ensureMembers(ids)
  const sum = split.shares.reduce((acc, s) => acc + s.shareCents, 0)
  if (sum !== amountCents) {
    throw new BadRequestError(
      `Σ cotas (${sum}) difere do valor da despesa (${amountCents})`,
    )
  }
  return split.shares.map((s) => ({
    userId: s.userId,
    shareCents: s.shareCents,
  }))
}

function safeSplit(amountCents: number, weights: number[]): number[] {
  try {
    return splitByLargestRemainder(amountCents, weights)
  } catch (err) {
    if (err instanceof MoneyError) throw new BadRequestError(err.message)
    throw err
  }
}
