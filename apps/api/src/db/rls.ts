import { sql } from 'drizzle-orm'
import { db } from './client'

/** Handle transacional do drizzle (derivado do callback de `db.transaction`). */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Executor aceito pelos services: a conexão base ou uma transação. */
export type Executor = typeof db | Tx

/**
 * Executa `fn` dentro de uma transação com o contexto de usuário definido para
 * a RLS (migration 0002). `set_config(..., true)` = escopo local à transação
 * (equivalente a `SET LOCAL`), então cada requisição só enxerga os próprios dados.
 *
 * Toda leitura/escrita autenticada DEVE passar por aqui — é o que faz a RLS
 * valer no runtime (o papel `wally_app` não faz bypass).
 */
export function runAsUser<T>(
  userId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
    )
    return fn(tx)
  })
}
