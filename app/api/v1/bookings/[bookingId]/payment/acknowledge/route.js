import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { idempotent: true, body: z.object({ method: z.enum(['cash', 'upi', 'other']).optional() }).strict().optional().default({}) },
  async ({ user, params }) => ({ data: await booking.acknowledgePayment(user.id, params.bookingId) }),
)
