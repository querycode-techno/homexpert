import * as booking from '@/lib/domain/booking'
import { route } from '@/lib/platform/route'

export const GET = route({ limit: { name: 'jobotp', key: 'customer', limit: 60, windowSeconds: 600 } }, async ({ user, params }) => ({ data: await booking.getJobOtp(user.id, params.bookingId) }))
