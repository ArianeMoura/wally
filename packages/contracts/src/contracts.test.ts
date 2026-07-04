import { describe, it, expect } from 'vitest'
import { createTransactionBody } from './transactions'
import { signUpBody } from './auth'
import { splitSpec, createExpenseBody } from './groups'
import { positiveCents } from './common'

describe('primitivos monetários', () => {
  it('rejeita centavos fracionários (nada de float para dinheiro)', () => {
    expect(positiveCents.safeParse(10.5).success).toBe(false)
    expect(positiveCents.safeParse(0).success).toBe(false)
    expect(positiveCents.safeParse(150).success).toBe(true)
  })
})

describe('auth.signUpBody', () => {
  it('normaliza e-mail para minúsculas', () => {
    const parsed = signUpBody.parse({
      name: 'Alice',
      email: 'Alice@Example.COM',
      password: 'segredo123',
    })
    expect(parsed.email).toBe('alice@example.com')
  })
  it('rejeita senha curta', () => {
    const r = signUpBody.safeParse({
      name: 'A',
      email: 'a@b.com',
      password: '123',
    })
    expect(r.success).toBe(false)
  })
})

describe('transactions.createTransactionBody', () => {
  it('aceita despesa válida', () => {
    const r = createTransactionBody.safeParse({
      type: 'expense',
      amountCents: 4990,
      description: 'Almoço',
    })
    expect(r.success).toBe(true)
  })
  it('rejeita valor negativo', () => {
    const r = createTransactionBody.safeParse({
      type: 'expense',
      amountCents: -100,
      description: 'x',
    })
    expect(r.success).toBe(false)
  })
})

describe('groups.splitSpec (união discriminada)', () => {
  it('aceita modo equal', () => {
    expect(
      splitSpec.safeParse({ mode: 'equal', participantIds: [crypto.randomUUID()] })
        .success,
    ).toBe(true)
  })
  it('aceita modo weights', () => {
    expect(
      splitSpec.safeParse({
        mode: 'weights',
        weights: [{ userId: crypto.randomUUID(), weight: 2 }],
      }).success,
    ).toBe(true)
  })
  it('rejeita peso não positivo', () => {
    expect(
      splitSpec.safeParse({
        mode: 'weights',
        weights: [{ userId: crypto.randomUUID(), weight: 0 }],
      }).success,
    ).toBe(false)
  })
  it('rejeita modo desconhecido', () => {
    expect(splitSpec.safeParse({ mode: 'random' }).success).toBe(false)
  })
  it('createExpenseBody exige split', () => {
    const r = createExpenseBody.safeParse({
      amountCents: 3000,
      description: 'Jantar',
      split: { mode: 'equal', participantIds: [crypto.randomUUID()] },
    })
    expect(r.success).toBe(true)
  })
})
