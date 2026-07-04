import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env'
import * as schema from './schema'

/**
 * Pool de conexões e cliente Drizzle.
 * `casing: 'snake_case'` mapeia chaves camelCase do schema para colunas snake_case.
 */
export const pool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle(pool, { schema, casing: 'snake_case' })

export type Database = typeof db
