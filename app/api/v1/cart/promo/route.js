import { z } from 'zod'
import * as cart from '@/lib/domain/cart'
import { route } from '@/lib/platform/route'

export const POST = route(
  { limit: { name: 'promo', key: 'customer', limit: 20, windowSeconds: 600 }, body: z.object({ code: z.string().trim().min(1).max(24) }).strict() },
  async ({ user, body }) => ({ data: await cart.applyPromoCode(user.id, body.code) }),
)

export const DELETE = route({}, async ({ user }) => ({ data: await cart.removePromoCode(user.id) }))
