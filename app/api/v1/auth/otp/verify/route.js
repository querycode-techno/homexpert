import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

const device = z.object({ deviceId: z.string().min(8).max(100), platform: z.enum(['android','ios']), osVersion: z.string().max(40).optional(), model: z.string().max(80).optional(), appVersion: z.string().max(20), fcmToken: z.string().max(4096).nullable().optional(), locale: z.string().max(20).optional() }).strict()

export const POST = route(
  { auth: 'none', limit: { name: 'verify', key: 'ip', limit: 60, windowSeconds: 3600 }, body: z.object({ otpRequestId: z.string(), otp: z.string().regex(/^[0-9]{6}$/, 'Enter the 6-digit code'), name: z.string().trim().max(80).optional(), email: z.string().email().optional(), device }).strict() },
  async ({ body, ip, req }) => ({ data: await identity.verifyOtp({ ...body, ip, userAgent: req.headers.get('user-agent') || undefined }) }),
)
