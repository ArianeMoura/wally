/**
 * Converte a entrada do usuário em reais (ex.: "12,50" ou "12.5") para inteiro
 * de centavos, sem passar por float. Retorna null se inválido.
 */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const [intPart, fracPart = ''] = normalized.split('.')
  const cents = Number(intPart) * 100 + Number((fracPart + '00').slice(0, 2))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}
