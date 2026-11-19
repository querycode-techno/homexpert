import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ query: z.object({ tab: z.enum(['upcoming', 'past', 'cancelled']).optional(), cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).optional() }) }, async ({ user, query }) => {
  const r = await booking.listBookings(user.id, query)
  return { data: r.items, meta: { nextCursor: r.nextCursor } }
})
