import { timestamp } from 'drizzle-orm/pg-core'

/**
 * Colunas de auditoria compartilhadas por todas as tabelas.
 * Retorna builders novos a cada chamada (não reutilizar instâncias entre tabelas).
 * O casing `snake_case` é aplicado no cliente/drizzle-kit → `created_at`, etc.
 */
export const timestamps = () => ({
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp({ withTimezone: true }), // soft delete
})
