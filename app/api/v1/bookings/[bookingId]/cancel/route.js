import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { idempotent: true, body: z.object({ reasonCode: z.string().min(1).max(40), note: z.string().max(300).optional() }).strict() },
  async ({ user, params, body }) => ({ data: await booking.cancelBooking(user.id, params.bookingId, body) }),
)
