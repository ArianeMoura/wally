import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

/** Instância única do QueryClient (nunca recriar dentro de componentes). */
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
 * Persistência do cache (RNF-012) — leitura *cache-first* offline. Usa
 * AsyncStorage (compatível com Expo Go); para um dev build, react-native-mmkv
 * é um upgrade de performance direto.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'wally.query-cache',
})
