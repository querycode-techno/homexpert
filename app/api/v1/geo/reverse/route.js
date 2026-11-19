import { z } from 'zod'
import * as geo from '@/lib/domain/geo'
import { route } from '@/lib/platform/route'

export const GET = route(
  { auth: 'none', limit: { name: 'geo', key: 'ip', limit: 30, windowSeconds: 60 }, query: z.object({ lat: z.coerce.number().min(6).max(38), lng: z.coerce.number().min(67).max(98) }) },
  async ({ query }) => ({ data: await geo.reverse(query.lat, query.lng) }),
)
