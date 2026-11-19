import * as catalog from '@/lib/domain/catalog'
import { Waitlist } from '@/lib/models/catalogue'
import { hmac } from '@/lib/platform/ids'
import { required } from '@/lib/platform/env'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

const pincode = z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode')

export const GET = route(
  { auth: 'none', limit: { name: 'svc', key: 'ip', limit: 60, windowSeconds: 60 }, query: z.object({ pincode, categoryId: z.string().optional() }).passthrough() },
  async ({ query }) => ({ data: await catalog.checkServiceability(query.pincode, query.categoryId) }),
)

export const POST = route(
  { auth: 'none', limit: { name: 'wait', key: 'ip', limit: 10, windowSeconds: 3600 }, successStatus: 202, body: z.object({ pincode, phone: z.string().regex(/^[6-9][0-9]{9}$/, 'Enter a valid mobile number'), categoryId: z.string().optional() }).strict() },
  async ({ body }) => {
    const phoneHash = hmac(required('OTP_PEPPER'), `phone|+91${body.phone}`)
    await Waitlist.updateOne({ phoneHash, pincode: body.pincode }, { $setOnInsert: { phoneHash, pincode: body.pincode } }, { upsert: true })
    return { status: 202, data: null }
  },
)
