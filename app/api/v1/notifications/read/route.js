import * as notifications from '@/lib/domain/notifications'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route({ body: z.object({ ids: z.array(z.string()).max(100).optional(), all: z.boolean().optional() }).strict() }, async ({ user, body }) => {
  await notifications.markRead(user.id, body)
  return { status: 204 }
})
