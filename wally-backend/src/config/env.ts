import 'dotenv/config'
import { z } from 'zod'

/**
 * Validação de ambiente com fail-fast (RNF-011 / SECURITY.md):
 * a aplicação aborta o boot se qualquer variável obrigatória faltar ou for inválida.
 * Sem valores-padrão inseguros para segredos.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),

  DATABASE_URL: z.string().url(),

  // Segredos obrigatórios (sem fallback). Access curto + refresh rotativo (F1).
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET precisa de ≥ 32 caracteres'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET precisa de ≥ 32 caracteres'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),

  // CORS restrito por origem (lista separada por vírgula). '*' apenas em dev.
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
