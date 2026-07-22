/**
 * Converts user input in reais ("12,50" or "12.5") into integer cents without
 * going through a float. Returns null when the input is invalid.
 */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const [intPart, fracPart = ''] = normalized.split('.')
  const cents = Number(intPart) * 100 + Number((fracPart + '00').slice(0, 2))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}
