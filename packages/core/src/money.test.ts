import { describe, it, expect } from 'vitest'
import {
  assertCents,
  assertPositiveCents,
  addCents,
  formatCents,
  MoneyError,
} from './money'

describe('assertCents', () => {
  it('aceita inteiros seguros', () => {
    expect(() => assertCents(0)).not.toThrow()
    expect(() => assertCents(-500)).not.toThrow()
  })
  it('rejeita não inteiros e valores não finitos', () => {
    expect(() => assertCents(1.5)).toThrow(MoneyError)
    expect(() => assertCents(NaN)).toThrow(MoneyError)
    expect(() => assertCents(Infinity)).toThrow(MoneyError)
    expect(() => assertCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(MoneyError)
  })
})

describe('assertPositiveCents', () => {
  it('rejeita zero e negativos', () => {
    expect(() => assertPositiveCents(0)).toThrow(MoneyError)
    expect(() => assertPositiveCents(-1)).toThrow(MoneyError)
    expect(() => assertPositiveCents(1)).not.toThrow()
  })
})

describe('addCents', () => {
  it('soma valores válidos', () => {
    expect(addCents(100, 200, 50)).toBe(350)
  })
  it('rejeita parcela inválida', () => {
    expect(() => addCents(100, 1.5)).toThrow(MoneyError)
  })
})

describe('formatCents', () => {
  it('formata centavos como BRL', () => {
    // Intl puts a non-breaking space after "R$", so assert on the digits only.
    expect(formatCents(12345)).toContain('123,45')
    expect(formatCents(0)).toContain('0,00')
  })
})
