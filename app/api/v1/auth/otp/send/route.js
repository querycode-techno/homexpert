import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { auth: 'none', body: z.object({ phone: z.string().regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number'), deviceId: z.string().min(8).max(100), captchaToken: z.string().optional() }).strict() },
  async ({ body, ip }) => ({ data: await identity.sendOtp({ phone: body.phone, deviceId: body.deviceId, ip }) }),
)
