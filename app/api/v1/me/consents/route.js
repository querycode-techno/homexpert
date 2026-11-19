import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { body: z.object({ type: z.enum(['terms', 'privacy', 'marketing', 'analytics']), version: z.string().min(1).max(20), granted: z.boolean() }).strict() },
  async ({ user, body, ip, deviceId }) => {
    await identity.recordConsent(user.id, body, { ip, deviceId })
    return { status: 204 }
  },
)
