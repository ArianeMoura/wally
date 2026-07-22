import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

/** Single QueryClient instance — never recreate this inside a component. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // 24h para sobreviver ao cache persistido
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Cache persistence (RNF-012) for cache-first offline reads. Uses AsyncStorage
 * because it works inside Expo Go; on a dev build, react-native-mmkv is a drop-in
 * performance upgrade.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'wally.query-cache',
})
