import * as cart from '@/lib/domain/cart'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { limit: { name: 'merge', key: 'customer', limit: 10, windowSeconds: 60 }, body: z.object({ items: z.array(z.object({ serviceId: z.string(), subServiceId: z.string(), quantity: z.number().int().min(1).max(20).optional() }).strict()).max(20) }).strict() },
  async ({ user, body }) => ({ data: await cart.mergeGuestCart(user.id, body.items) }),
)
