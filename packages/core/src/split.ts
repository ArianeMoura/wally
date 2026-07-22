import { MoneyError, assertNonNegativeCents } from './money'

/**
 * Splits a total in cents across weights using the largest remainder method.
 * Guarantees, deterministically:
 *   • Σ shares == totalCents (no cent is lost or invented — RNF-010)
 *   • each share is within 1 cent of its ideal value
 *   • leftover cents go to the largest remainders; ties break on lowest index
 *
 * Uses BigInt internally so large totals and weights neither lose precision nor
 * overflow the safe integer range.
 *
 * @param totalCents integer cents ≥ 0
 * @param weights    integer weights ≥ 0 (`[1,1,1]` for an even split; `[2,1,1]`
 *                   if the first participant covers double)
 * @returns integer shares, in the same order as the weights
 */
export function splitByLargestRemainder(
  totalCents: number,
  weights: number[],
): number[] {
  assertNonNegativeCents(totalCents, 'totalCents')
  if (weights.length === 0) {
    throw new MoneyError('É preciso ao menos um peso para dividir')
  }
  for (const w of weights) {
    if (!Number.isInteger(w) || w < 0) {
      throw new MoneyError(`peso deve ser inteiro ≥ 0 (recebido: ${w})`)
    }
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight <= 0) {
    throw new MoneyError('a soma dos pesos deve ser > 0')
  }

  const T = BigInt(totalCents)
  const W = BigInt(totalWeight)

  // base = floor(total * weight / totalWeight); rem = the remainder of that division.
  const parts = weights.map((weight, index) => {
    const numerator = T * BigInt(weight)
    return {
      index,
      base: Number(numerator / W),
      rem: numerator % W,
    }
  })

  const assigned = parts.reduce((s, p) => s + p.base, 0)
  const leftover = totalCents - assigned // cents left to hand out (< weights.length)

  // Largest remainder first; ties break on lowest index, keeping this deterministic.
  const order = [...parts].sort((a, b) => {
    if (a.rem === b.rem) return a.index - b.index
    return a.rem > b.rem ? -1 : 1
  })

  const result = new Array<number>(weights.length)
  for (const p of parts) result[p.index] = p.base
  for (let k = 0; k < leftover; k++) {
    const p = order[k]!
    result[p.index] = p.base + 1
  }
  return result
}

/** Splits `totalCents` evenly across `n` participants. */
export function splitEqually(totalCents: number, n: number): number[] {
  if (!Number.isInteger(n) || n <= 0) {
    throw new MoneyError(`n deve ser inteiro > 0 (recebido: ${n})`)
  }
  return splitByLargestRemainder(totalCents, new Array<number>(n).fill(1))
}
