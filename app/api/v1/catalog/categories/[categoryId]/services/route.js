import * as catalog from '@/lib/domain/catalog'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ auth: 'none', query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).optional(), sort: z.string().optional() }) }, async ({ params, query }) => {
  const r = await catalog.listServicesByCategory(params.categoryId, query)
  return { data: r.items, meta: { nextCursor: r.nextCursor } }
})
