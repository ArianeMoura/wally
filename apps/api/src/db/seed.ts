import { isNull } from 'drizzle-orm'
import { ownerDb as db, ownerPool as pool } from './client'
import { categories } from './schema'

/**
 * System default categories (`user_id = NULL`), readable by everyone (RF-017).
 * Runs as the database owner (bypassing RLS) and is idempotent: it only inserts
 * the ones that are missing.
 */
const DEFAULT_CATEGORIES: {
  name: string
  icon: string
  color: string
  kind: 'income' | 'expense'
}[] = [
  // Income
  { name: 'Salário', icon: 'cash', color: '#16A34A', kind: 'income' },
  { name: 'Freelance', icon: 'laptop', color: '#0EA5E9', kind: 'income' },
  {
    name: 'Investimentos',
    icon: 'trending-up',
    color: '#7C3AED',
    kind: 'income',
  },
  { name: 'Presente', icon: 'gift', color: '#DB2777', kind: 'income' },
  {
    name: 'Outras receitas',
    icon: 'plus-circle',
    color: '#65A30D',
    kind: 'income',
  },
  // Expenses
  {
    name: 'Alimentação',
    icon: 'silverware-fork-knife',
    color: '#F97316',
    kind: 'expense',
  },
  { name: 'Transporte', icon: 'car', color: '#2563EB', kind: 'expense' },
  { name: 'Moradia', icon: 'home', color: '#0891B2', kind: 'expense' },
  { name: 'Saúde', icon: 'heart-pulse', color: '#DC2626', kind: 'expense' },
  { name: 'Educação', icon: 'school', color: '#4F46E5', kind: 'expense' },
  { name: 'Lazer', icon: 'gamepad-variant', color: '#D946EF', kind: 'expense' },
  { name: 'Compras', icon: 'cart', color: '#EA580C', kind: 'expense' },
  { name: 'Contas', icon: 'file-document', color: '#64748B', kind: 'expense' },
  { name: 'Assinaturas', icon: 'repeat', color: '#9333EA', kind: 'expense' },
  {
    name: 'Outras despesas',
    icon: 'minus-circle',
    color: '#78716C',
    kind: 'expense',
  },
]

export async function seedDefaultCategories(): Promise<number> {
  const existing = await db
    .select({ name: categories.name })
    .from(categories)
    .where(isNull(categories.userId))

  const existingNames = new Set(existing.map((c) => c.name))
  const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name))

  if (missing.length === 0) return 0

  await db.insert(categories).values(
    missing.map((c) => ({
      userId: null,
      name: c.name,
      icon: c.icon,
      color: c.color,
      kind: c.kind,
    })),
  )
  return missing.length
}

async function main() {
  const inserted = await seedDefaultCategories()
  console.log(`✅ Seed concluído: ${inserted} categoria(s) padrão inserida(s).`)
  await pool.end()
}

// Only runs when invoked directly (tsx src/db/seed.ts).
main().catch(async (err) => {
  console.error('❌ Falha no seed:', err)
  await pool.end()
  process.exit(1)
})
