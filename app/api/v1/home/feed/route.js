import * as catalog from '@/lib/domain/catalog'
import crypto from 'crypto'
import * as booking from '@/lib/domain/booking'
import * as promo from '@/lib/domain/promo'
import { route } from '@/lib/platform/route'

export const GET = route({ auth: 'optional', limit: { name: 'home', key: 'ip', limit: 120, windowSeconds: 60 } }, async ({ req, query, user }) => {
  const data = await catalog.homeFeed(query.cityId)
  data.offers = await promo.listOffers(user?.id)
  if (user) {
    data.activeBooking = (await booking.listBookings(user.id, { tab: 'upcoming', limit: 1 })).items[0] || null
  }
  const etag = `"${crypto.createHash('sha1').update(JSON.stringify(data)).digest('hex')}"`
  if (req.headers.get('if-none-match') === etag) {
    return { status: 304, headers: { ETag: etag } }
  }
  return { data, headers: { ETag: etag, 'Cache-Control': 'private, no-cache' } }
})
