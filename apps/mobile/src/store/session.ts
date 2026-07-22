import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { UserPublic } from '@wally/contracts'

const ACCESS_KEY = 'wally.accessToken'
const REFRESH_KEY = 'wally.refreshToken'
const USER_KEY = 'wally.user'

interface SessionState {
  accessToken: string | null
  refreshToken: string | null
  user: UserPublic | null
  hydrated: boolean

  setSession: (data: {
    accessToken: string
    refreshToken: string
    user: UserPublic
  }) => Promise<void>
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>
  clear: () => Promise<void>
  restore: () => Promise<void>
}

/**
 * User session. Tokens live in secure storage (Keychain/Keystore through
 * expo-secure-store); the access token is injected into every request and
 * rotated by the HTTP client on expiry — see lib/api.ts.
 */
export const useSession = create<SessionState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,

  setSession: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ])
    set({ accessToken, refreshToken, user })
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ])
    set({ accessToken, refreshToken })
  },

  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ])
    set({ accessToken: null, refreshToken: null, user: null })
  },

  restore: async () => {
    if (get().hydrated) return
    const [accessToken, refreshToken, userRaw] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ])
    const user = userRaw ? (JSON.parse(userRaw) as UserPublic) : null
    set({ accessToken, refreshToken, user, hydrated: true })
  },
}))

/** Non-reactive access, for the HTTP client outside of React components. */
export const sessionStore = useSession
