import 'dotenv/config'
import { z } from 'zod'

/**
 * Fail-fast environment validation (RNF-011 / SECURITY.md): the app aborts the
 * boot if any required variable is missing or invalid. Secrets have no defaults.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),

  // Owner connection — used by migrations and the seed; bypasses RLS.
  DATABASE_URL: z.string().url(),
  // Runtime connection (`wally_app`, subject to RLS). Required in production;
  // falls back to DATABASE_URL in development.
  APP_DATABASE_URL: z.string().url().optional(),

  // Required secrets, no fallback. Short access token + rotating refresh.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET precisa de ≥ 32 caracteres'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET precisa de ≥ 32 caracteres'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  RESET_TOKEN_TTL: z.string().default('1h'),

  // Comma-separated allowlist of origins. '*' is for development only.
  CORS_ORIGIN: z.string().default('*'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
