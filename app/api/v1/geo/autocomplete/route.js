import { z } from 'zod'
import * as geo from '@/lib/domain/geo'
import { route } from '@/lib/platform/route'

export const GET = route(
  { auth: 'none', limit: { name: 'geo', key: 'ip', limit: 30, windowSeconds: 60 }, query: z.object({ q: z.string().trim().min(3).max(80) }) },
  async ({ query }) => ({ data: await geo.autocomplete(query.q) }),
)
