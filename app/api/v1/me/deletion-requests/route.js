import * as booking from '@/lib/domain/booking'
import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { successStatus: 202, body: z.object({ reasonCode: z.string().max(40).optional(), note: z.string().max(300).optional() }).strict().optional().default({}) },
  async ({ user, body }) => ({ status: 202, data: await identity.requestDeletion(user.id, body, await booking.countActive(user.id)) }),
)

export const DELETE = route({ successStatus: 204 }, async ({ user }) => {
  await identity.cancelDeletion(user.id)
  return { status: 204 }
})
