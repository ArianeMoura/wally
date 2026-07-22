/**
 * Safe money arithmetic. The rule (RNF-010): money is always an integer number
 * of cents. Floats are banned for amounts and appear only at the formatting
 * boundary, for display.
 */

export class MoneyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoneyError'
  }
}

/** Asserts `value` is an integer of cents that is safely representable. */
export function assertCents(value: number, label = 'valor'): void {
  if (!Number.isInteger(value)) {
    throw new MoneyError(
      `${label} deve ser inteiro de centavos (recebido: ${value})`,
    )
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} excede o inteiro seguro (${value})`)
  }
}

export function assertNonNegativeCents(value: number, label = 'valor'): void {
  assertCents(value, label)
  if (value < 0)
    throw new MoneyError(`${label} não pode ser negativo (${value})`)
}

export function assertPositiveCents(value: number, label = 'valor'): void {
  assertCents(value, label)
  if (value <= 0) throw new MoneyError(`${label} deve ser positivo (${value})`)
}

/** Sums cents, validating both the inputs and the result. */
export function addCents(...values: number[]): number {
  let sum = 0
  for (const v of values) {
    assertCents(v)
    sum += v
  }
  assertCents(sum, 'soma')
  return sum
}

/** Formats cents as display currency (BRL by default). */
export function formatCents(
  cents: number,
  locale = 'pt-BR',
  currency = 'BRL',
): string {
  assertCents(cents, 'cents')
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    cents / 100,
  )
}
