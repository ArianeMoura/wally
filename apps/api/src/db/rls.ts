import { sql } from 'drizzle-orm'
import { db } from './client'

/** Drizzle transaction handle, as passed to the `db.transaction` callback. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** What services accept: either the base connection or a transaction. */
export type Executor = typeof db | Tx

/**
 * Runs `fn` in a transaction with the RLS user context set (migration 0002).
 * The `true` argument to `set_config` scopes it to the transaction (like
 * `SET LOCAL`), so a request only ever sees its own rows.
 *
 * Every authenticated read and write MUST go through here: this is what makes
 * RLS bite at runtime, since `wally_app` cannot bypass it.
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
