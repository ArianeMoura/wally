import { and, asc, eq, isNull } from 'drizzle-orm'
import type {
  CategoryResponse,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '@wally/contracts'
import type { Tx } from '../../db/rls'
import { categories } from '../../db/schema/finance'
import { NotFoundError } from '../../http/errors'

type CategoryRow = typeof categories.$inferSelect

function toResponse(c: CategoryRow): CategoryResponse {
  return {
    id: c.id,
    userId: c.userId ?? null,
    name: c.name,
    icon: c.icon ?? null,
    color: c.color ?? null,
    kind: c.kind,
    createdAt: c.createdAt.toISOString(),
  }
}

/** Lista categorias visíveis: padrões do sistema + próprias (RLS garante o resto). */
export async function listCategories(tx: Tx): Promise<CategoryResponse[]> {
  const rows = await tx
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(asc(categories.kind), asc(categories.name))
  return rows.map(toResponse)
}

export async function createCategory(
  tx: Tx,
  userId: string,
  body: CreateCategoryBody,
): Promise<CategoryResponse> {
  const [row] = await tx
    .insert(categories)
    .values({
      userId,
      name: body.name,
      icon: body.icon,
      color: body.color,
      kind: body.kind,
    })
    .returning()
  return toResponse(row!)
}

export async function updateCategory(
  tx: Tx,
  id: string,
  body: UpdateCategoryBody,
): Promise<CategoryResponse> {
  const patch: Partial<CategoryRow> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.icon !== undefined) patch.icon = body.icon
  if (body.color !== undefined) patch.color = body.color
  if (body.kind !== undefined) patch.kind = body.kind

  const [row] = await tx
    .update(categories)
    .set(patch)
    .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
    .returning()
  if (!row) throw new NotFoundError('Categoria não encontrada')
  return toResponse(row)
}

export async function deleteCategory(tx: Tx, id: string): Promise<void> {
  const [row] = await tx
    .update(categories)
    .set({ deletedAt: new Date() })
    .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
    .returning({ id: categories.id })
  if (!row) throw new NotFoundError('Categoria não encontrada')
}
