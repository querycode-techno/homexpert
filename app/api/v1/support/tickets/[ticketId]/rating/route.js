import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route({ successStatus: 204, body: z.object({ rating: z.number().int().min(1).max(5), feedback: z.string().max(300).optional() }).strict() }, async ({ user, params, body }) => {
  await support.rateTicket(user.id, params.ticketId, body)
  return { status: 204 }
})
