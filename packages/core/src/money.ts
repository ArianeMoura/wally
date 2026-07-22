/**
 * Aritmética monetária segura. Regra de ouro (RNF-010): dinheiro é sempre um
 * inteiro de centavos. `float`/`double` é proibido para valores — só entra no
 * limite da formatação para exibição.
 */

export class MoneyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoneyError'
  }
}

/** Garante que `value` é um inteiro de centavos representável com segurança. */
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

/** Soma segura de centavos (valida entradas e resultado). */
export function addCents(...values: number[]): number {
  let sum = 0
  for (const v of values) {
    assertCents(v)
    sum += v
  }
  assertCents(sum, 'soma')
  return sum
}

/** Formata centavos como moeda para exibição (padrão BRL). */
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
