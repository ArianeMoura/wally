import { z } from 'zod'
import { uuid, password, isoDateTime } from './common'

/** Public view of a user; never carries `passwordHash`. */
export const userPublic = z.object({
  id: uuid,
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().url().nullable(),
  aiConsentAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
})

export const updateProfileBody = z
  .object({
    name: z.string().min(1).max(120),
    avatarUrl: z.string().url().nullable(),
    password,
  })
  .partial()

/** LGPD consent for AI processing (RF-021 / RNF-014). */
export const aiConsentBody = z.object({ consent: z.boolean() })

export type UserPublic = z.infer<typeof userPublic>
export type UpdateProfileBody = z.infer<typeof updateProfileBody>
export type AiConsentBody = z.infer<typeof aiConsentBody>
