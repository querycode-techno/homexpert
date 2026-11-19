import * as booking from '@/lib/domain/booking'
import * as media from '@/lib/domain/media'
import { notify } from '@/lib/domain/notifications'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  {
    successStatus: 201,
    idempotent: true,
    limit: { name: 'checkout', key: 'customer', limit: 10, windowSeconds: 60 },
    body: z.object({ addressId: z.string(), slotId: z.string(), notes: z.string().max(500).optional(), urgency: z.enum(['normal', 'urgent']).optional(), photoUploadIds: z.array(z.string()).max(5).optional(), expectedTotal: z.object({ amountPaise: z.number().int(), currency: z.literal('INR'), display: z.string().optional() }).optional() }).strict(),
  },
  async ({ user, body }) => {
    if (body.photoUploadIds?.length) {
      await media.consumeUploads(user.id, 'booking_photo', body.photoUploadIds)
    }
    const result = await booking.checkout(user.id, body)
    await notify(user.id, { category: 'bookings', title: 'Booking received', body: 'We are finding the right Xpert for you.', deepLink: `homesxpert://booking/${result.bookings[0].id}`, dedupeKey: `created:${result.checkoutId}`, smsText: `HomesXpert: booking ${result.bookings[0].displayId} received. We are finding your Xpert.` })
    return { status: 201, data: result }
  },
)
