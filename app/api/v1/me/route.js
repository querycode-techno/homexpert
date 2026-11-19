import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({}, async ({ user }) => ({ data: await identity.getMe(user.id) }))

export const PATCH = route(
  { limit: { name: 'me', key: 'customer', limit: 30, windowSeconds: 60 }, body: z.object({ name: z.string().trim().min(1, 'Please enter your name').max(80).optional(), email: z.string().email('Enter a valid email').nullable().optional(), gender: z.enum(['female', 'male', 'other', 'undisclosed']).optional(), avatarUploadId: z.string().optional(), referralCode: z.string().trim().max(12).optional() }).strict() },
  async ({ user, body, req }) => ({ data: await identity.updateMe(user.id, body, req.headers.get('if-match') ?? undefined) }),
)
