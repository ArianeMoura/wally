import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { Tx } from '../db/rls'
import { idempotencyKeys } from '../db/schema/auth'
import { ConflictError } from '../http/errors'

/**
 * Deterministic hash of the write request body. Stored alongside the
 * Idempotency-Key to tell a genuine replay of the same request apart from the
 * key being reused with a different body (RNF-009).
 */
export function requestHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

/**
 * Wraps a financial write with idempotency semantics (RNF-009). With no key it
 * just runs. With a key: a stored result for the same key and hash is replayed;
 * the same key with a different body is a 409. The INSERT runs in the SAME
 * transaction as the mutation, which is what makes the effect exactly-once.
 */
export async function withIdempotency<T>(opts: {
  tx: Tx
  userId: string
  key: string | undefined
  hash: string
  statusCode: number
  work: () => Promise<T>
}): Promise<T> {
  const { tx, userId, key, hash, statusCode, work } = opts
  if (!key) return work()

  const [existing] = await tx
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1)

  if (existing) {
    if (existing.userId !== userId || existing.requestHash !== hash) {
      throw new ConflictError('Idempotency-Key já usada para outra requisição')
    }
    return existing.response as T
  }

  const result = await work()
  await tx.insert(idempotencyKeys).values({
    key,
    userId,
    requestHash: hash,
    statusCode,
    response: result as object,
  })
  return result
}
