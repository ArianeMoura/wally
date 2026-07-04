import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env'
import * as schema from './schema'

/**
 * Duas conexões, por design de segurança (ver migration 0002_rls_policies):
 *   • runtime (`db`/`pool`) — papel `wally_app`, SUJEITO à RLS. É o que o servidor
 *     usa para atender requisições. Em produção use `APP_DATABASE_URL`.
 *   • dono (`ownerDb`/`ownerPool`) — `DATABASE_URL`, faz bypass de RLS. Usado por
 *     seed e tarefas administrativas. Migrations rodam via drizzle-kit (DATABASE_URL).
 */
const runtimeUrl = env.APP_DATABASE_URL ?? env.DATABASE_URL

export const pool = new Pool({ connectionString: runtimeUrl })
export const db = drizzle(pool, { schema, casing: 'snake_case' })

export const ownerPool = new Pool({ connectionString: env.DATABASE_URL })
export const ownerDb = drizzle(ownerPool, { schema, casing: 'snake_case' })

export type Database = typeof db
