import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route({ idempotent: true, body: z.object({ slotId: z.string() }).strict() }, async ({ user, params, body }) => ({ data: await booking.rescheduleBooking(user.id, params.bookingId, body.slotId) }))
