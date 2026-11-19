import { z } from 'zod'
import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'

export const POST = route(
  { idempotent: true, body: z.object({ decision: z.enum(['approve', 'decline']), note: z.string().max(300).optional() }).strict() },
  async ({ user, params, body }) => ({ data: await booking.respondToQuote(user.id, params.bookingId, params.quoteId, body) }),
)
