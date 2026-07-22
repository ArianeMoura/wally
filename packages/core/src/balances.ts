import {
  MoneyError,
  assertNonNegativeCents,
  assertPositiveCents,
} from './money'

export interface ShareInput {
  userId: string
  shareCents: number
}

export interface ExpenseInput {
  payerId: string
  amountCents: number
  shares: ShareInput[]
}

export interface SettlementInput {
  fromUserId: string
  toUserId: string
  amountCents: number
}

export interface BalancesInput {
  /** Known group members, so everyone shows up even with a zero balance. */
  memberIds: string[]
  expenses: ExpenseInput[]
  settlements: SettlementInput[]
}

/** A suggested transfer to settle up (RF-018). */
export interface Transfer {
  fromUserId: string
  toUserId: string
  amountCents: number
}

/**
 * Net balance per member, in cents.
 *   • balance > 0 → the group owes them (creditor)
 *   • balance < 0 → they owe the group (debtor)
 *
 * Invariant: Σ balances == 0. Every expense is checked for Σ shares == amount
 * before it contributes to a balance.
 */
export function computeBalances(input: BalancesInput): Map<string, number> {
  const balances = new Map<string, number>()
  for (const id of input.memberIds) balances.set(id, 0)

  const add = (id: string, delta: number): void => {
    balances.set(id, (balances.get(id) ?? 0) + delta)
  }

  for (const expense of input.expenses) {
    assertPositiveCents(expense.amountCents, 'amountCents da despesa')
    let sumShares = 0
    for (const share of expense.shares) {
      assertNonNegativeCents(share.shareCents, 'shareCents')
      sumShares += share.shareCents
    }
    if (sumShares !== expense.amountCents) {
      throw new MoneyError(
        `Σ cotas (${sumShares}) != valor da despesa (${expense.amountCents})`,
      )
    }
    // The payer is credited the full amount; each participant is debited their share.
    add(expense.payerId, expense.amountCents)
    for (const share of expense.shares) add(share.userId, -share.shareCents)
  }

  for (const s of input.settlements) {
    assertPositiveCents(s.amountCents, 'amountCents da liquidação')
    if (s.fromUserId === s.toUserId) {
      throw new MoneyError('liquidação não pode ter pagador == recebedor')
    }
    // `from` pays `to`: the debt of `from` shrinks (+), the credit of `to` shrinks (-).
    add(s.fromUserId, s.amountCents)
    add(s.toUserId, -s.amountCents)
  }

  return balances
}

/**
 * Reduces balances to the fewest transfers that zero the group out: a greedy
 * match of the largest debtor against the largest creditor. Ties break on
 * `userId` so the result is deterministic.
 */
export function simplifyDebts(balances: Map<string, number>): Transfer[] {
  const debtors: { id: string; amt: number }[] = []
  const creditors: { id: string; amt: number }[] = []
  for (const [id, balance] of balances) {
    if (balance < 0) debtors.push({ id, amt: -balance })
    else if (balance > 0) creditors.push({ id, amt: balance })
  }

  const byAmountDesc = (
    a: { id: string; amt: number },
    b: { id: string; amt: number },
  ): number => b.amt - a.amt || a.id.localeCompare(b.id)
  debtors.sort(byAmountDesc)
  creditors.sort(byAmountDesc)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!
    const creditor = creditors[j]!
    const pay = Math.min(debtor.amt, creditor.amt)
    if (pay > 0) {
      transfers.push({
        fromUserId: debtor.id,
        toUserId: creditor.id,
        amountCents: pay,
      })
    }
    debtor.amt -= pay
    creditor.amt -= pay
    if (debtor.amt === 0) i++
    if (creditor.amt === 0) j++
  }
  return transfers
}
