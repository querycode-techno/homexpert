import * as invoice from '@/lib/domain/invoice'
import { route } from '@/lib/platform/route'

export const GET = route({ limit: { name: 'invoice', key: 'customer', limit: 30, windowSeconds: 600 } }, async ({ user, params, req }) => {
  const origin = process.env.PUBLIC_API_ORIGIN || new URL(req.url).origin
  return { data: await invoice.invoiceLink(user.id, params.bookingId, origin) }
})
