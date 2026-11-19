import * as reviews from '@/lib/domain/reviews'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ auth: 'optional', query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).optional() }) }, async ({ params, query, user }) => {
  const r = await reviews.listServiceReviews(params.serviceId, query, user?.id)
  return { data: r.items, meta: { nextCursor: r.nextCursor, ...(r.summary ? { summary: r.summary } : {}) } }
})
