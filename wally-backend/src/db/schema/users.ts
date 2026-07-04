import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(), // Argon2id (F1) — dimensionado para o hash completo
  avatarUrl: text(),
  // Consentimento LGPD para processamento por IA (RF-021 / RNF-014).
  aiConsentAt: timestamp({ withTimezone: true }),
  ...timestamps(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
