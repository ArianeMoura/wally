import {
  and,
  eq,
  isNull,
  gte,
  lt,
  ilike,
  desc,
  count,
  sql,
  type SQL,
} from 'drizzle-orm'
import type {
  BalanceSummary,
  CreateTransactionBody,
  ListTransactionsQuery,
  TransactionResponse,
  UpdateTransactionBody,
} from '@wally/contracts'
import type { Tx } from '../../db/rls'
import { transactions } from '../../db/schema/finance'
import { NotFoundError } from '../../http/errors'
import { monthRange } from '../../lib/dates'

type TransactionRow = typeof transactions.$inferSelect

function toResponse(t: TransactionRow): TransactionResponse {
  return {
    id: t.id,
    userId: t.userId,
    type: t.type,
    amountCents: t.amountCents,
    description: t.description,
    categoryId: t.categoryId ?? null,
    occurredAt: t.occurredAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }
}

export async function createTransaction(
  tx: Tx,
  userId: string,
  body: CreateTransactionBody,
): Promise<TransactionResponse> {
  const [row] = await tx
    .insert(transactions)
    .values({
      userId,
      type: body.type,
      amountCents: body.amountCents,
      description: body.description,
      categoryId: body.categoryId,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    })
    .returning()
  return toResponse(row!)
}

export async function listTransactions(
  tx: Tx,
  query: ListTransactionsQuery,
): Promise<{
  items: TransactionResponse[]
  page: number
  pageSize: number
  total: number
}> {
  const conditions: SQL[] = [isNull(transactions.deletedAt)]
  if (query.type) conditions.push(eq(transactions.type, query.type))
  if (query.categoryId)
    conditions.push(eq(transactions.categoryId, query.categoryId))
  if (query.from)
    conditions.push(gte(transactions.occurredAt, new Date(query.from)))
  if (query.to) conditions.push(lt(transactions.occurredAt, new Date(query.to)))
  if (query.search)
    conditions.push(ilike(transactions.description, `%${query.search}%`))

  const where = and(...conditions)
  const offset = (query.page - 1) * query.pageSize

  const [rows, [totalRow]] = await Promise.all([
    tx
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.occurredAt))
      .limit(query.pageSize)
      .offset(offset),
    tx.select({ value: count() }).from(transactions).where(where),
  ])

  return {
    items: rows.map(toResponse),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow?.value ?? 0,
  }
}

export async function updateTransaction(
  tx: Tx,
  id: string,
  body: UpdateTransactionBody,
): Promise<TransactionResponse> {
  const patch: Partial<TransactionRow> = {}
  if (body.type !== undefined) patch.type = body.type
  if (body.amountCents !== undefined) patch.amountCents = body.amountCents
  if (body.description !== undefined) patch.description = body.description
  if (body.categoryId !== undefined) patch.categoryId = body.categoryId
  if (body.occurredAt !== undefined)
    patch.occurredAt = new Date(body.occurredAt)

  const [row] = await tx
    .update(transactions)
    .set(patch)
    .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
    .returning()
  if (!row) throw new NotFoundError('Transação não encontrada')
  return toResponse(row)
}

export async function deleteTransaction(tx: Tx, id: string): Promise<void> {
  const [row] = await tx
    .update(transactions)
    .set({ deletedAt: new Date() })
    .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
    .returning({ id: transactions.id })
  if (!row) throw new NotFoundError('Transação não encontrada')
}

/** RF-008 — saldo automático do período (padrão: mês corrente). */
export async function balanceSummaryFor(
  tx: Tx,
  from: Date | undefined,
  to: Date | undefined,
): Promise<BalanceSummary> {
  const range = from && to ? { start: from, end: to } : monthRange(new Date())

  const rows = await tx
    .select({
      type: transactions.type,
      total: sql<number>`coalesce(sum(${transactions.amountCents}), 0)::bigint`,
    })
    .from(transactions)
    .where(
      and(
        isNull(transactions.deletedAt),
        gte(transactions.occurredAt, range.start),
        lt(transactions.occurredAt, range.end),
      ),
    )
    .groupBy(transactions.type)

  let incomeCents = 0
  let expenseCents = 0
  for (const row of rows) {
    const value = Number(row.total)
    if (row.type === 'income') incomeCents = value
    else expenseCents = value
  }
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents }
}
