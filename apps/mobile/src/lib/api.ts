import type { AuthResponse } from '@wally/contracts'
import { API_BASE_URL, API_PREFIX } from './env'
import { sessionStore } from '../store/session'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Idempotency key for financial writes (RNF-009). */
  idempotencyKey?: string
  /** Public request: no token is injected and no refresh is attempted. */
  public?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

/** Rotates the tokens once, coordinating concurrent callers. */
async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const { refreshToken } = sessionStore.getState()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        await sessionStore.getState().clear()
        return false
      }
      const data = (await res.json()) as AuthResponse
      await sessionStore
        .getState()
        .setTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

async function raw<T>(path: string, options: RequestOptions): Promise<T> {
  const { accessToken } = sessionStore.getState()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!options.public && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  const res = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 204) return undefined as T
  if (res.ok) return (await res.json()) as T

  const payload = (await res.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null
  throw new ApiError(
    res.status,
    payload?.error ?? 'ERROR',
    payload?.message ?? `HTTP ${res.status}`,
  )
}

/**
 * Runs the request; on a 401 it rotates the token once and retries. If the
 * refresh fails the session is cleared and the error propagates, sending the
 * app back to the login screen.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await raw<T>(path, options)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !options.public) {
      const refreshed = await refreshTokens()
      if (refreshed) return raw<T>(path, options)
    }
    throw err
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    request<T>(path, { method: 'POST', body, idempotencyKey }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postPublic: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body, public: true }),
}
