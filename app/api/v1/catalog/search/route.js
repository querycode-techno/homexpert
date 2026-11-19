import * as catalog from '@/lib/domain/catalog'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ auth: 'none', limit: { name: 'search', key: 'ip', limit: 120, windowSeconds: 60 }, query: z.object({ q: z.string().trim().min(2, 'Type at least 2 letters').max(60), cursor: z.string().optional(), categoryId: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).optional() }) }, async ({ query }) => {
  const r = await catalog.searchServices(query.q, query)
  return { data: r.items, meta: { nextCursor: r.nextCursor, facets: r.facets, fuzzy: r.fuzzy } }
})
