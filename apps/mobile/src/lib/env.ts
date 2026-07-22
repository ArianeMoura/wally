/** App environment configuration, from Expo's public variables. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3333'

/** Versioned API prefix. */
export const API_PREFIX = '/api/v1'
