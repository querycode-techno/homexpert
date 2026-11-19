import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'

export const GET = route({}, async ({ user, params }) => ({ data: await booking.getBooking(user.id, params.bookingId) }))
