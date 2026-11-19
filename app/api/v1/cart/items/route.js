import * as cart from '@/lib/domain/cart'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { limit: { name: 'cartadd', key: 'customer', limit: 60, windowSeconds: 60 }, body: z.object({ serviceId: z.string(), subServiceId: z.string(), quantity: z.number().int().min(1).max(20).optional() }).strict() },
  async ({ user, body }) => ({ data: await cart.addItem(user.id, body) }),
)
