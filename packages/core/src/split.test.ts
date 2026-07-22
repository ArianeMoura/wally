import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { splitByLargestRemainder, splitEqually } from './split'
import { MoneyError } from './money'

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)

describe('splitByLargestRemainder — casos canônicos', () => {
  it('R$ 10,00 / 3 fecha exatamente em 1000 centavos', () => {
    const parts = splitEqually(1000, 3)
    expect(parts).toEqual([334, 333, 333])
    expect(sum(parts)).toBe(1000)
  })

  it('divisão exata não gera resto', () => {
    expect(splitEqually(900, 3)).toEqual([300, 300, 300])
  })

  it('pesos proporcionais [2,1,1] de 1000', () => {
    expect(splitByLargestRemainder(1000, [2, 1, 1])).toEqual([500, 250, 250])
  })

  it('resto vai para os maiores restos, empate pelo menor índice', () => {
    // 100 / 3 = 33,33 → base 33 cada (99), 1 centavo sobra → índice 0
    expect(splitEqually(100, 3)).toEqual([34, 33, 33])
    // 1 centavo entre 3 → só o primeiro recebe
    expect(splitEqually(1, 3)).toEqual([1, 0, 0])
  })

  it('total zero → todas as cotas zero', () => {
    expect(splitEqually(0, 4)).toEqual([0, 0, 0, 0])
  })

  it('participante único recebe o total', () => {
    expect(splitEqually(777, 1)).toEqual([777])
  })

  it('peso zero não recebe cota', () => {
    expect(splitByLargestRemainder(1000, [0, 1, 1])).toEqual([0, 500, 500])
  })
})

describe('splitByLargestRemainder — entradas inválidas', () => {
  it('rejeita total não inteiro', () => {
    expect(() => splitEqually(10.5, 2)).toThrow(MoneyError)
  })
  it('rejeita total negativo', () => {
    expect(() => splitEqually(-100, 2)).toThrow(MoneyError)
  })
  it('rejeita lista de pesos vazia', () => {
    expect(() => splitByLargestRemainder(100, [])).toThrow(MoneyError)
  })
  it('rejeita soma de pesos zero', () => {
    expect(() => splitByLargestRemainder(100, [0, 0])).toThrow(MoneyError)
  })
  it('rejeita peso negativo', () => {
    expect(() => splitByLargestRemainder(100, [1, -1])).toThrow(MoneyError)
  })
})

describe('splitByLargestRemainder — propriedades (fast-check)', () => {
  it('a soma das cotas é SEMPRE igual ao total (nenhum centavo some/surge)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000_000 }),
        fc.array(fc.integer({ min: 1, max: 100 }), {
          minLength: 1,
          maxLength: 25,
        }),
        (total, weights) => {
          const parts = splitByLargestRemainder(total, weights)
          return sum(parts) === total
        },
      ),
    )
  })

  it('cada cota não é negativa e difere da cota ideal em < 1 centavo', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000_000 }),
        fc.array(fc.integer({ min: 1, max: 100 }), {
          minLength: 1,
          maxLength: 25,
        }),
        (total, weights) => {
          const totalWeight = sum(weights)
          const parts = splitByLargestRemainder(total, weights)
          return parts.every((part, i) => {
            const ideal = (total * (weights[i] as number)) / totalWeight
            return (
              part >= 0 && part >= Math.floor(ideal) && part <= Math.ceil(ideal)
            )
          })
        },
      ),
    )
  })

  it('divisão igualitária: diferença entre a maior e a menor cota é ≤ 1', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 50 }),
        (total, n) => {
          const parts = splitEqually(total, n)
          return Math.max(...parts) - Math.min(...parts) <= 1
        },
      ),
    )
  })

  it('é determinística: mesma entrada → mesma saída', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000_000 }),
        fc.array(fc.integer({ min: 1, max: 100 }), {
          minLength: 1,
          maxLength: 25,
        }),
        (total, weights) => {
          const a = splitByLargestRemainder(total, weights)
          const b = splitByLargestRemainder(total, weights)
          return a.every((v, i) => v === b[i])
        },
      ),
    )
  })
})
