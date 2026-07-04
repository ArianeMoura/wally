import { and, eq, isNull, inArray, desc, sql } from 'drizzle-orm'
import { computeBalances, simplifyDebts, type ExpenseInput } from '@wally/core'
import type {
  CreateExpenseBody,
  CreateSettlementBody,
  ExpenseResponse,
  SettlementResponse,
  GroupBalancesResponse,
} from '@wally/contracts'
import { runAsUser, type Tx } from '../../db/rls'
import {
  groups,
  groupMembers,
  groupExpenses,
  expenseShares,
  settlements,
} from '../../db/schema/groups'
import { BadRequestError, NotFoundError } from '../../http/errors'
import { requestHash, withIdempotency } from '../../lib/idempotency'
import { emitFinancialEvent } from '../audit/audit.service'
import { resolveSplit, type ResolvedShare } from './split'

type ExpenseRow = typeof groupExpenses.$inferSelect
type SettlementRow = typeof settlements.$inferSelect

function toExpenseResponse(
  e: ExpenseRow,
  shares: ResolvedShare[],
): ExpenseResponse {
  return {
    id: e.id,
    groupId: e.groupId,
    payerId: e.payerId,
    amountCents: e.amountCents,
    description: e.description,
    categoryId: e.categoryId ?? null,
    occurredAt: e.occurredAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    shares: shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
  }
}

function toSettlementResponse(s: SettlementRow): SettlementResponse {
  return {
    id: s.id,
    groupId: s.groupId,
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amountCents: s.amountCents,
    settledAt: s.settledAt.toISOString(),
  }
}

/**
 * Serializa as mutações do grupo e devolve os ids de membros ativos.
 *
 * Usa **advisory lock transacional** (fora do espaço da RLS) em vez de
 * `SELECT … FOR UPDATE` em `groups`: a policy de UPDATE de `groups` restringe o
 * lock de linha ao dono, mas qualquer membro pode lançar despesa/liquidação. O
 * advisory lock por `groupId` serializa todos igualmente e libera no commit.
 */
async function lockGroupAndMembers(
  tx: Tx,
  groupId: string,
): Promise<Set<string>> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${groupId})::bigint)`,
  )

  const [group] = await tx
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
    .limit(1)
  if (!group) throw new NotFoundError('Grupo não encontrado')

  const members = await tx
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), isNull(groupMembers.deletedAt)),
    )
  return new Set(members.map((m) => m.userId))
}

/**
 * RF-011 — cria uma despesa de grupo. Padrão transacional obrigatório:
 * idempotência → lock do grupo → releitura de membros → split (@wally/core) →
 * invariante Σ cotas == valor → insert atômico → bump de versão.
 */
export function createExpense(
  userId: string,
  groupId: string,
  body: CreateExpenseBody,
  idempotencyKey: string | undefined,
): Promise<ExpenseResponse> {
  return runAsUser(userId, async (tx) => {
    // Trava o grupo ANTES da checagem de idempotência: requisições concorrentes
    // do mesmo grupo serializam aqui, então a 2ª enxerga a chave já commitada
    // (evita a corrida TOCTOU de duplicar a escrita).
    const memberIds = await lockGroupAndMembers(tx, groupId)
    return withIdempotency({
      tx,
      userId,
      key: idempotencyKey,
      hash: requestHash({ groupId, body }),
      statusCode: 201,
      work: async () => {
        const payerId = body.payerId ?? userId
        if (!memberIds.has(payerId)) {
          throw new BadRequestError('O pagador não é membro ativo do grupo')
        }

        const shares = resolveSplit(body.split, body.amountCents, memberIds)

        const [expense] = await tx
          .insert(groupExpenses)
          .values({
            groupId,
            payerId,
            amountCents: body.amountCents,
            description: body.description,
            categoryId: body.categoryId,
            occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
          })
          .returning()

        await tx.insert(expenseShares).values(
          shares.map((s) => ({
            groupExpenseId: expense!.id,
            userId: s.userId,
            shareCents: s.shareCents,
          })),
        )

        await tx.execute(sql`SELECT bump_group_version(${groupId})`)
        const response = toExpenseResponse(expense!, shares)
        await emitFinancialEvent(tx, {
          actorId: userId,
          entityType: 'group_expense',
          entityId: expense!.id,
          eventType: 'created',
          after: response,
        })
        return response
      },
    })
  })
}

/** RF-018 — registra uma liquidação (settle up) sob a mesma disciplina. */
export function createSettlement(
  userId: string,
  groupId: string,
  body: CreateSettlementBody,
  idempotencyKey: string | undefined,
): Promise<SettlementResponse> {
  return runAsUser(userId, async (tx) => {
    const memberIds = await lockGroupAndMembers(tx, groupId)
    return withIdempotency({
      tx,
      userId,
      key: idempotencyKey,
      hash: requestHash({ groupId, body }),
      statusCode: 201,
      work: async () => {
        const fromUserId = body.fromUserId ?? userId
        const { toUserId } = body
        if (fromUserId === toUserId) {
          throw new BadRequestError('Pagador e recebedor devem ser distintos')
        }
        if (!memberIds.has(fromUserId) || !memberIds.has(toUserId)) {
          throw new BadRequestError('Ambas as partes devem ser membros ativos')
        }

        const [settlement] = await tx
          .insert(settlements)
          .values({
            groupId,
            fromUserId,
            toUserId,
            amountCents: body.amountCents,
          })
          .returning()

        await tx.execute(sql`SELECT bump_group_version(${groupId})`)
        const response = toSettlementResponse(settlement!)
        await emitFinancialEvent(tx, {
          actorId: userId,
          entityType: 'settlement',
          entityId: settlement!.id,
          eventType: 'created',
          after: response,
        })
        return response
      },
    })
  })
}

async function loadExpensesWithShares(
  tx: Tx,
  groupId: string,
): Promise<{ expense: ExpenseRow; shares: ResolvedShare[] }[]> {
  const expenses = await tx
    .select()
    .from(groupExpenses)
    .where(
      and(eq(groupExpenses.groupId, groupId), isNull(groupExpenses.deletedAt)),
    )
    .orderBy(desc(groupExpenses.occurredAt))
  if (expenses.length === 0) return []

  const shareRows = await tx
    .select()
    .from(expenseShares)
    .where(
      and(
        inArray(
          expenseShares.groupExpenseId,
          expenses.map((e) => e.id),
        ),
        isNull(expenseShares.deletedAt),
      ),
    )

  const byExpense = new Map<string, ResolvedShare[]>()
  for (const s of shareRows) {
    const list = byExpense.get(s.groupExpenseId) ?? []
    list.push({ userId: s.userId, shareCents: s.shareCents })
    byExpense.set(s.groupExpenseId, list)
  }
  return expenses.map((expense) => ({
    expense,
    shares: byExpense.get(expense.id) ?? [],
  }))
}

export function listExpenses(
  userId: string,
  groupId: string,
): Promise<ExpenseResponse[]> {
  return runAsUser(userId, async (tx) => {
    // Visibilidade garantida pela RLS; grupo inexistente devolve lista vazia.
    const rows = await loadExpensesWithShares(tx, groupId)
    return rows.map(({ expense, shares }) => toExpenseResponse(expense, shares))
  })
}

/** RF-012/018 — saldos do grupo + sugestão de acerto (Σ saldos == 0). */
export function getBalances(
  userId: string,
  groupId: string,
): Promise<GroupBalancesResponse> {
  return runAsUser(userId, async (tx) => {
    const [group] = await tx
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1)
    if (!group) throw new NotFoundError('Grupo não encontrado')

    const members = await tx
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), isNull(groupMembers.deletedAt)),
      )

    const expensesWithShares = await loadExpensesWithShares(tx, groupId)
    const expenses: ExpenseInput[] = expensesWithShares.map(
      ({ expense, shares }) => ({
        payerId: expense.payerId,
        amountCents: expense.amountCents,
        shares: shares.map((s) => ({
          userId: s.userId,
          shareCents: s.shareCents,
        })),
      }),
    )

    const settlementRows = await tx
      .select()
      .from(settlements)
      .where(
        and(eq(settlements.groupId, groupId), isNull(settlements.deletedAt)),
      )

    const balances = computeBalances({
      memberIds: members.map((m) => m.userId),
      expenses,
      settlements: settlementRows.map((s) => ({
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amountCents: s.amountCents,
      })),
    })

    return {
      balances: [...balances.entries()].map(([id, balanceCents]) => ({
        userId: id,
        balanceCents,
      })),
      suggestedTransfers: simplifyDebts(balances),
    }
  })
}
