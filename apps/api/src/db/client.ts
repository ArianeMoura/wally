import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env'
import * as schema from './schema'

/**
 * Two connections, by security design (see migration 0002_rls_policies):
 *   • runtime (`db`/`pool`) — role `wally_app`, subject to RLS. This is what the
 *     server serves requests with; set `APP_DATABASE_URL` in production.
 *   • owner (`ownerDb`/`ownerPool`) — `DATABASE_URL`, bypasses RLS. Used by the
 *     seed and admin tasks. Migrations run through drizzle-kit on DATABASE_URL.
 */
const runtimeUrl = env.APP_DATABASE_URL ?? env.DATABASE_URL

export const pool = new Pool({ connectionString: runtimeUrl })
export const db = drizzle(pool, { schema, casing: 'snake_case' })

export const ownerPool = new Pool({ connectionString: env.DATABASE_URL })
export const ownerDb = drizzle(ownerPool, { schema, casing: 'snake_case' })

export type Database = typeof db
