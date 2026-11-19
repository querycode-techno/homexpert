import * as cart from '@/lib/domain/cart'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const PATCH = route({ body: z.object({ quantity: z.number().int().min(1).max(20) }).strict() }, async ({ user, params, body }) => ({ data: await cart.setQuantity(user.id, params.lineId, body.quantity) }))

export const DELETE = route({}, async ({ user, params }) => ({ data: await cart.removeItem(user.id, params.lineId) }))
