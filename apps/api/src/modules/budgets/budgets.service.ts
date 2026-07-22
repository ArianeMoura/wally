import { and, eq, isNull, gte, lt, sql } from 'drizzle-orm'
import type {
  BudgetResponse,
  BudgetStatus,
  CreateBudgetBody,
  UpdateBudgetBody,
} from '@wally/contracts'
import type { Tx } from '../../db/rls'
import { budgets, transactions } from '../../db/schema/finance'
import { NotFoundError } from '../../http/errors'
import { periodRange } from '../../lib/dates'

type BudgetRow = typeof budgets.$inferSelect

function toResponse(b: BudgetRow): BudgetResponse {
  return {
    id: b.id,
    userId: b.userId,
    categoryId: b.categoryId,
    period: b.period,
    limitCents: b.limitCents,
    createdAt: b.createdAt.toISOString(),
  }
}

export async function createBudget(
  tx: Tx,
  userId: string,
  body: CreateBudgetBody,
): Promise<BudgetResponse> {
  const [row] = await tx
    .insert(budgets)
    .values({
      userId,
      categoryId: body.categoryId,
      period: body.period,
      limitCents: body.limitCents,
    })
    .returning()
  return toResponse(row!)
}

export async function updateBudget(
  tx: Tx,
  id: string,
  body: UpdateBudgetBody,
): Promise<BudgetResponse> {
  const patch: Partial<BudgetRow> = {}
  if (body.categoryId !== undefined) patch.categoryId = body.categoryId
  if (body.period !== undefined) patch.period = body.period
  if (body.limitCents !== undefined) patch.limitCents = body.limitCents

  const [row] = await tx
    .update(budgets)
    .set(patch)
    .where(and(eq(budgets.id, id), isNull(budgets.deletedAt)))
    .returning()
  if (!row) throw new NotFoundError('Orçamento não encontrado')
  return toResponse(row)
}

export async function deleteBudget(tx: Tx, id: string): Promise<void> {
  const [row] = await tx
    .update(budgets)
    .set({ deletedAt: new Date() })
    .where(and(eq(budgets.id, id), isNull(budgets.deletedAt)))
    .returning({ id: budgets.id })
  if (!row) throw new NotFoundError('Orçamento não encontrado')
}

/** RF-019 — budgets with current-period spend and the overspend alert. */
export async function listBudgetStatus(tx: Tx): Promise<BudgetStatus[]> {
  const rows = await tx.select().from(budgets).where(isNull(budgets.deletedAt))

  const now = new Date()
  const result: BudgetStatus[] = []
  for (const b of rows) {
    const range = periodRange(b.period, now)
    const [spentRow] = await tx
      .select({
        total: sql<number>`coalesce(sum(${transactions.amountCents}), 0)::bigint`,
      })
      .from(transactions)
      .where(
        and(
          isNull(transactions.deletedAt),
          eq(transactions.categoryId, b.categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.occurredAt, range.start),
          lt(transactions.occurredAt, range.end),
        ),
      )
    const spentCents = Number(spentRow?.total ?? 0)
    result.push({
      ...toResponse(b),
      spentCents,
      remainingCents: b.limitCents - spentCents,
      exceeded: spentCents > b.limitCents,
    })
  }
  return result
}
