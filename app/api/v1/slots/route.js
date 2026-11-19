import * as addresses from '@/lib/domain/addresses'
import * as slots from '@/lib/domain/slots'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route(
  { query: z.object({ addressId: z.string(), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), days: z.coerce.number().int().min(1).max(14).optional(), serviceId: z.string().optional() }) },
  async ({ user, query }) => {
    const a = await addresses.getOwnedAddress(user.id, query.addressId)
    return { data: await slots.listSlots({ cityName: a.city, from: query.from, days: query.days || 7 }) }
  },
)
