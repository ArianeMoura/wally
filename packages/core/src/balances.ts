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
  /** Membros conhecidos do grupo (garante que apareçam com saldo 0). */
  memberIds: string[]
  expenses: ExpenseInput[]
  settlements: SettlementInput[]
}

/** Transferência sugerida para acertar contas (RF-018). */
export interface Transfer {
  fromUserId: string
  toUserId: string
  amountCents: number
}

/**
 * Calcula o saldo líquido de cada membro, em centavos.
 *   • saldo > 0  → o grupo deve a ele (credor)
 *   • saldo < 0  → ele deve ao grupo (devedor)
 *
 * Invariante garantida: **Σ saldos == 0** (o que uns devem, os outros têm a
 * receber). Cada despesa valida `Σ cotas == valor` antes de compor o saldo.
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
    // Quem pagou fica credor pelo total; cada participante fica devedor pela cota.
    add(expense.payerId, expense.amountCents)
    for (const share of expense.shares) add(share.userId, -share.shareCents)
  }

  for (const s of input.settlements) {
    assertPositiveCents(s.amountCents, 'amountCents da liquidação')
    if (s.fromUserId === s.toUserId) {
      throw new MoneyError('liquidação não pode ter pagador == recebedor')
    }
    // `from` paga `to`: a dívida de `from` diminui (+), o crédito de `to` diminui (-).
    add(s.fromUserId, s.amountCents)
    add(s.toUserId, -s.amountCents)
  }

  return balances
}

/**
 * Reduz os saldos ao **menor número de transferências** que zera o grupo
 * (algoritmo guloso: casa o maior devedor com o maior credor). Determinístico:
 * empates são resolvidos por ordem de `userId`.
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
