import * as cart from '@/lib/domain/cart'
import { route } from '@/lib/platform/route'

export const GET = route({}, async ({ user }) => ({ data: await cart.getCart(user.id) }))

export const DELETE = route({ successStatus: 204 }, async ({ user }) => {
  await cart.clearCart(user.id)
  return { status: 204 }
})
