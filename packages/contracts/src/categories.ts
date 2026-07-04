import { z } from 'zod'
import { uuid, isoDateTime } from './common'

export const categoryKind = z.enum(['income', 'expense'])

export const createCategoryBody = z.object({
  name: z.string().min(1).max(60),
  icon: z.string().max(60).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'cor deve ser hex #RRGGBB')
    .optional(),
  kind: categoryKind,
})

export const updateCategoryBody = createCategoryBody.partial()

export const categoryResponse = z.object({
  id: uuid,
  userId: uuid.nullable(), // null = categoria padrão do sistema
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  kind: categoryKind,
  createdAt: isoDateTime,
})

export type CategoryKind = z.infer<typeof categoryKind>
export type CreateCategoryBody = z.infer<typeof createCategoryBody>
export type UpdateCategoryBody = z.infer<typeof updateCategoryBody>
export type CategoryResponse = z.infer<typeof categoryResponse>
