import { parseAmountToCents } from './money'

describe('parseAmountToCents', () => {
  it('converte reais para centavos sem float', () => {
    expect(parseAmountToCents('12,50')).toBe(1250)
    expect(parseAmountToCents('12.5')).toBe(1250)
    expect(parseAmountToCents('100')).toBe(10000)
    expect(parseAmountToCents('0,01')).toBe(1)
  })

  it('rejeita entradas inválidas ou não positivas', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('0')).toBeNull()
    expect(parseAmountToCents('1,234')).toBeNull()
    expect(parseAmountToCents('-5')).toBeNull()
  })
})
