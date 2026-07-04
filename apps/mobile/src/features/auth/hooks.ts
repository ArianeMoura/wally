import { useMutation } from '@tanstack/react-query'
import type { AuthResponse, SignInBody, SignUpBody } from '@wally/contracts'
import { api } from '../../lib/api'
import { useSession } from '../../store/session'
import { queryClient } from '../../lib/queryClient'

export function useSignIn() {
  const setSession = useSession((s) => s.setSession)
  return useMutation({
    mutationFn: (body: SignInBody) =>
      api.postPublic<AuthResponse>('/auth/signin', body),
    onSuccess: (data) => setSession(data),
  })
}

export function useSignUp() {
  const setSession = useSession((s) => s.setSession)
  return useMutation({
    mutationFn: (body: SignUpBody) =>
      api.postPublic<AuthResponse>('/auth/signup', body),
    onSuccess: (data) => setSession(data),
  })
}

export function useLogout() {
  const clear = useSession((s) => s.clear)
  return async () => {
    const { refreshToken } = useSession.getState()
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken })
    } catch {
      // logout é best-effort; limpamos localmente de qualquer forma.
    }
    await clear()
    queryClient.clear()
  }
}
