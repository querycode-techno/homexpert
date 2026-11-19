import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const PUT = route(
  { body: z.object({ language: z.enum(['en', 'hi']).optional(), theme: z.enum(['system', 'light', 'dark']).optional(), notifications: z.object({ bookings: z.boolean().optional(), reminders: z.boolean().optional(), support: z.boolean().optional(), offers: z.boolean().optional() }).strict().optional() }).strict() },
  async ({ user, body }) => ({ data: await identity.updatePreferences(user.id, body) }),
)
