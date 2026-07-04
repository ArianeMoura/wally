import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BalanceSummary,
  CreateTransactionBody,
  TransactionResponse,
} from '@wally/contracts'
import { api } from '../../lib/api'

interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

const KEYS = {
  list: ['transactions'] as const,
  summary: ['transactions', 'summary'] as const,
}

export function useTransactions() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: () =>
      api.get<Paginated<TransactionResponse>>('/transactions?pageSize=50'),
  })
}

export function useBalanceSummary() {
  return useQuery({
    queryKey: KEYS.summary,
    queryFn: () => api.get<BalanceSummary>('/transactions/summary'),
  })
}

/** Criação com UI otimista: aplica local, reconcilia com o servidor. */
export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTransactionBody) =>
      api.post<TransactionResponse>('/transactions', body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: KEYS.list })
      const previous = qc.getQueryData<Paginated<TransactionResponse>>(KEYS.list)
      const optimistic: TransactionResponse = {
        id: `optimistic-${Date.now()}`,
        userId: 'me',
        type: body.type,
        amountCents: body.amountCents,
        description: body.description,
        categoryId: body.categoryId ?? null,
        occurredAt: body.occurredAt ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<Paginated<TransactionResponse>>(KEYS.list, (old) =>
        old
          ? { ...old, items: [optimistic, ...old.items], total: old.total + 1 }
          : { items: [optimistic], page: 1, pageSize: 50, total: 1 },
      )
      return { previous }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.list, ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEYS.list })
      void qc.invalidateQueries({ queryKey: KEYS.summary })
    },
  })
}

/** Remoção com UI otimista. */
export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/transactions/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.list })
      const previous = qc.getQueryData<Paginated<TransactionResponse>>(KEYS.list)
      qc.setQueryData<Paginated<TransactionResponse>>(KEYS.list, (old) =>
        old
          ? {
              ...old,
              items: old.items.filter((t) => t.id !== id),
              total: Math.max(0, old.total - 1),
            }
          : old,
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.list, ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEYS.list })
      void qc.invalidateQueries({ queryKey: KEYS.summary })
    },
  })
}
