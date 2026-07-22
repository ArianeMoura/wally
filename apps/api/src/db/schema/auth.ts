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
 * RNF-011 — rotating refresh tokens with reuse detection. Stored only as a hash;
 * `familyId` groups the rotation chain so the whole family can be revoked at once
 * when an already-used token is replayed, which signals a leak.
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
 * RNF-009 — idempotent financial writes. The same `key`, per user, replays the
 * original response instead of reprocessing.
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

/**
 * RF-002 — password recovery. Single-use, hashed, short-lived token. The
 * endpoint answers identically for known and unknown emails, so it never leaks
 * whether an account exists.
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text().notNull().unique(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  usedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type RefreshToken = typeof refreshTokens.$inferSelect
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
