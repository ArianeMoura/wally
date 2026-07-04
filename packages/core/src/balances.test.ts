import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeBalances, simplifyDebts, type ExpenseInput } from './balances'
import { splitEqually } from './split'
import { MoneyError } from './money'

const totalBalance = (b: Map<string, number>): number =>
  [...b.values()].reduce((a, x) => a + x, 0)

describe('computeBalances — casos canônicos', () => {
  it('Alice paga 900 dividido igualmente entre A, B, C', () => {
    const balances = computeBalances({
      memberIds: ['A', 'B', 'C'],
      expenses: [
        {
          payerId: 'A',
          amountCents: 900,
          shares: [
            { userId: 'A', shareCents: 300 },
            { userId: 'B', shareCents: 300 },
            { userId: 'C', shareCents: 300 },
          ],
        },
      ],
      settlements: [],
    })
    expect(balances.get('A')).toBe(600) // pagou 900, consumiu 300
    expect(balances.get('B')).toBe(-300)
    expect(balances.get('C')).toBe(-300)
    expect(totalBalance(balances)).toBe(0)
  })

  it('liquidação zera a dívida', () => {
    const balances = computeBalances({
      memberIds: ['A', 'B'],
      expenses: [
        {
          payerId: 'A',
          amountCents: 1000,
          shares: [
            { userId: 'A', shareCents: 500 },
            { userId: 'B', shareCents: 500 },
          ],
        },
      ],
      settlements: [{ fromUserId: 'B', toUserId: 'A', amountCents: 500 }],
    })
    expect(balances.get('A')).toBe(0)
    expect(balances.get('B')).toBe(0)
  })

  it('rejeita despesa cujo Σ cotas != valor', () => {
    const bad: ExpenseInput = {
      payerId: 'A',
      amountCents: 1000,
      shares: [
        { userId: 'A', shareCents: 500 },
        { userId: 'B', shareCents: 499 },
      ],
    }
    expect(() =>
      computeBalances({ memberIds: ['A', 'B'], expenses: [bad], settlements: [] }),
    ).toThrow(MoneyError)
  })

  it('membros sem movimento aparecem com saldo 0', () => {
    const balances = computeBalances({
      memberIds: ['A', 'B', 'C'],
      expenses: [],
      settlements: [],
    })
    expect(balances.get('C')).toBe(0)
  })
})

describe('simplifyDebts', () => {
  it('gera transferências que zeram o grupo', () => {
    const balances = new Map([
      ['A', 600],
      ['B', -300],
      ['C', -300],
    ])
    const transfers = simplifyDebts(balances)
    expect(totalBalance(balances)).toBe(0)
    const moved = transfers.reduce((s, t) => s + t.amountCents, 0)
    expect(moved).toBe(600)
  })
})

// ---- Geradores para propriedades -----------------------------------------
const members = ['A', 'B', 'C', 'D', 'E']

const expenseArb = fc
  .record({
    payerIdx: fc.integer({ min: 0, max: members.length - 1 }),
    amount: fc.integer({ min: 1, max: 5_000_000 }),
    participants: fc
      .subarray(members, { minLength: 1 })
      .filter((s) => s.length >= 1),
  })
  .map(({ payerIdx, amount, participants }): ExpenseInput => {
    const shares = splitEqually(amount, participants.length)
    return {
      payerId: members[payerIdx] as string,
      amountCents: amount,
      shares: participants.map((userId, i) => ({
        userId,
        shareCents: shares[i] as number,
      })),
    }
  })

describe('computeBalances — propriedades (fast-check)', () => {
  it('Σ saldos == 0 para qualquer combinação de despesas', () => {
    fc.assert(
      fc.property(fc.array(expenseArb, { maxLength: 40 }), (expenses) => {
        const balances = computeBalances({
          memberIds: members,
          expenses,
          settlements: [],
        })
        return totalBalance(balances) === 0
      }),
    )
  })

  it('após aplicar as transferências de simplifyDebts, todos zeram', () => {
    fc.assert(
      fc.property(fc.array(expenseArb, { maxLength: 40 }), (expenses) => {
        const balances = computeBalances({
          memberIds: members,
          expenses,
          settlements: [],
        })
        const transfers = simplifyDebts(balances)
        // Aplica cada transferência como se fosse uma liquidação real.
        const settled = computeBalances({
          memberIds: members,
          expenses,
          settlements: transfers,
        })
        return [...settled.values()].every((v) => v === 0)
      }),
    )
  })

  it('simplifyDebts usa no máximo (nº de membros - 1) transferências', () => {
    fc.assert(
      fc.property(fc.array(expenseArb, { maxLength: 40 }), (expenses) => {
        const balances = computeBalances({
          memberIds: members,
          expenses,
          settlements: [],
        })
        return simplifyDebts(balances).length <= members.length - 1
      }),
    )
  })
})
