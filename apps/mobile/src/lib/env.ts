/** Configuração de ambiente do app (variáveis públicas do Expo). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3333'

/** Prefixo versionado da API. */
export const API_PREFIX = '/api/v1'
