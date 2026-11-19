import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

const device = z.object({ deviceId: z.string().min(8).max(100), platform: z.enum(['android','ios']), osVersion: z.string().max(40).optional(), model: z.string().max(80).optional(), appVersion: z.string().max(20), fcmToken: z.string().max(4096).nullable().optional(), locale: z.string().max(20).optional() }).strict()

export const POST = route({ body: device }, async ({ user, body }) => {
  await identity.registerDevice(user.id, body)
  return { status: 204 }
})
