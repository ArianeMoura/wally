import { timestamp } from 'drizzle-orm/pg-core'

/**
 * Audit columns shared by every table. Returns fresh builders on each call —
 * instances must not be reused across tables. snake_case is applied by
 * drizzle-kit, so these land as `created_at` and friends.
 */
export const timestamps = () => ({
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp({ withTimezone: true }), // soft delete
})
