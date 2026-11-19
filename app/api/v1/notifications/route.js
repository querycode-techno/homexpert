import * as notifications from '@/lib/domain/notifications'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).optional() }) }, async ({ user, query }) => {
  const r = await notifications.listNotifications(user.id, query)
  return { data: r.items, meta: { nextCursor: r.nextCursor } }
})
