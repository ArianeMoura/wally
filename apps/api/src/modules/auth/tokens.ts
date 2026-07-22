import { createHmac, randomBytes } from 'node:crypto'

/**
 * Refresh and reset tokens are opaque random strings. Only an HMAC-SHA256 —
 * peppered with the server secret — is stored, so leaking the table is not
 * enough to forge a token (RNF-011 / SECURITY.md).
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex')
}

/** Converts durations like `15m`, `30d`, `1h`, `90s` into milliseconds. */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(input.trim())
  if (!match) throw new Error(`duração inválida: ${input}`)
  const value = Number(match[1])
  const unit = match[2]
  const factor: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }
  return value * (factor[unit as string] as number)
}

export function expiryFrom(ttl: string, now: number): Date {
  return new Date(now + parseDurationMs(ttl))
}
