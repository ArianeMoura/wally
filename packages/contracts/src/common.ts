import { z } from 'zod'

/** Primitives shared across every domain. */

export const uuid = z.string().uuid()
export const email = z.string().email().toLowerCase()
export const password = z.string().min(8).max(128)

/** Money is always an integer of cents (RNF-010), never a float. */
export const positiveCents = z.number().int().positive()
export const nonNegativeCents = z.number().int().nonnegative()

/** Response timestamps travel as ISO-8601 strings — JSON has no `Date`. */
export const isoDateTime = z.string().datetime({ offset: true })

export const timestamps = z.object({
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
})

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  })
}

export const errorResponse = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
})

export type PaginationQuery = z.infer<typeof paginationQuery>
export type ErrorResponse = z.infer<typeof errorResponse>
