import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { Tx } from '../db/rls'
import { idempotencyKeys } from '../db/schema/auth'
import { ConflictError } from '../http/errors'

/**
 * Hash determinístico do conteúdo da requisição de escrita. Guardado junto à
 * Idempotency-Key para detectar reenvio do MESMO pedido (replay) vs. reuso
 * indevido da chave com corpo diferente (RNF-009).
 */
export function requestHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

/**
 * Envolve uma escrita financeira com semântica de idempotência (RNF-009). Sem
 * chave, apenas executa. Com chave: se já houver resultado gravado para a mesma
 * chave/hash, faz *replay*; se a chave foi usada com corpo diferente, 409.
 * O INSERT roda na MESMA transação da mutação → efeito único e atômico.
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
