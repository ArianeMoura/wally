import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './users'

/**
 * RNF-011 — refresh tokens rotativos com detecção de reúso.
 * Guardados apenas como hash; `familyId` agrupa a cadeia de rotação para revogação
 * em massa quando um token já usado é reapresentado (indício de vazamento).
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text().notNull().unique(),
  familyId: uuid().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  revokedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

/**
 * RNF-009 — idempotência de escrita financeira.
 * A mesma `key` (por usuário) retorna a resposta original em vez de reprocessar.
 */
export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  requestHash: text().notNull(),
  statusCode: integer(),
  response: jsonb(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type RefreshToken = typeof refreshTokens.$inferSelect
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect
