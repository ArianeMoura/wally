import { MoneyError, assertNonNegativeCents } from './money'

/**
 * Divisão de um total em centavos por pesos, usando o método do **maior resto**
 * (largest remainder). Garante, de forma determinística e exata:
 *   • Σ cotas == totalCents  (nenhum centavo some ou é criado — RNF-010)
 *   • cada cota difere da cota "ideal" em no máximo 1 centavo
 *   • o(s) centavo(s) residual(is) vão para os maiores restos; empate → menor índice
 *
 * A aritmética do rateio usa BigInt internamente para não perder precisão nem
 * estourar o inteiro seguro em totais/pesos grandes.
 *
 * @param totalCents inteiro de centavos ≥ 0
 * @param weights    pesos inteiros ≥ 0 (ex.: `[1,1,1]` para divisão igualitária;
 *                   `[2,1,1]` se o primeiro participante arca com o dobro)
 * @returns array de cotas inteiras, na mesma ordem dos pesos
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

  // base = floor(total * peso / somaPesos); rem = resto dessa divisão (inteiro).
  const parts = weights.map((weight, index) => {
    const numerator = T * BigInt(weight)
    return {
      index,
      base: Number(numerator / W),
      rem: numerator % W,
    }
  })

  const assigned = parts.reduce((s, p) => s + p.base, 0)
  const leftover = totalCents - assigned // nº de centavos a distribuir (< weights.length)

  // Ordena por maior resto; empate resolvido pelo menor índice (determinístico).
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

/** Divisão igualitária de `totalCents` entre `n` participantes. */
export function splitEqually(totalCents: number, n: number): number[] {
  if (!Number.isInteger(n) || n <= 0) {
    throw new MoneyError(`n deve ser inteiro > 0 (recebido: ${n})`)
  }
  return splitByLargestRemainder(totalCents, new Array<number>(n).fill(1))
}
