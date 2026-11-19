import * as catalog from '@/lib/domain/catalog'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ auth: 'none', limit: { name: 'suggest', key: 'ip', limit: 180, windowSeconds: 60 }, query: z.object({ q: z.string().trim().min(1).max(40) }) }, async ({ query }) => ({ data: await catalog.suggest(query.q) }))
