import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).optional() }) }, async ({ user, query }) => {
  const r = await support.listTickets(user.id, query)
  return { data: r.items, meta: { nextCursor: r.nextCursor } }
})

export const POST = route(
  { successStatus: 201, idempotent: true, limit: { name: 'ticket', key: 'customer', limit: 10, windowSeconds: 3600 }, body: z.object({ topicId: z.string(), bookingId: z.string().optional(), description: z.string().trim().min(5, 'Please describe the problem').max(1000), attachmentUploadIds: z.array(z.string()).max(3).optional() }).strict() },
  async ({ user, body }) => ({ status: 201, data: await support.createTicket(user.id, body) }),
)
