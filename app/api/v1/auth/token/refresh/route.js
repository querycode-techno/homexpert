import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { auth: 'none', limit: { name: 'refresh', key: 'ip', limit: 120, windowSeconds: 3600 }, body: z.object({ refreshToken: z.string().min(20).max(200) }).strict() },
  async ({ body, ip, req }) => ({ data: await identity.refresh({ refreshToken: body.refreshToken, ip, userAgent: req.headers.get('user-agent') || undefined }) }),
)
