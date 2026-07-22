import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateExpenseBody,
  CreateGroupBody,
  CreateSettlementBody,
  ExpenseResponse,
  GroupBalancesResponse,
  GroupMemberResponse,
  GroupResponse,
  SettlementResponse,
} from '@wally/contracts'
import { api } from '../../lib/api'

/** Chave de idempotência por intenção de escrita (RNF-009). */
function idempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

const KEYS = {
  all: ['groups'] as const,
  detail: (id: string) => ['groups', id] as const,
  members: (id: string) => ['groups', id, 'members'] as const,
  balances: (id: string) => ['groups', id, 'balances'] as const,
  expenses: (id: string) => ['groups', id, 'expenses'] as const,
}

export function useGroupMembers(id: string) {
  return useQuery({
    queryKey: KEYS.members(id),
    queryFn: () => api.get<GroupMemberResponse[]>(`/groups/${id}/members`),
  })
}

export function useGroups() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => api.get<GroupResponse[]>('/groups'),
  })
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<GroupResponse>(`/groups/${id}`),
  })
}

export function useGroupBalances(id: string) {
  return useQuery({
    queryKey: KEYS.balances(id),
    queryFn: () => api.get<GroupBalancesResponse>(`/groups/${id}/balances`),
  })
}

export function useGroupExpenses(id: string) {
  return useQuery({
    queryKey: KEYS.expenses(id),
    queryFn: () => api.get<ExpenseResponse[]>(`/groups/${id}/expenses`),
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGroupBody) =>
      api.post<GroupResponse>('/groups', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useCreateExpense(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateExpenseBody) =>
      api.post<ExpenseResponse>(
        `/groups/${groupId}/expenses`,
        body,
        idempotencyKey(),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.expenses(groupId) })
      void qc.invalidateQueries({ queryKey: KEYS.balances(groupId) })
    },
  })
}

export function useCreateSettlement(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSettlementBody) =>
      api.post<SettlementResponse>(
        `/groups/${groupId}/settlements`,
        body,
        idempotencyKey(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.balances(groupId) }),
  })
}
