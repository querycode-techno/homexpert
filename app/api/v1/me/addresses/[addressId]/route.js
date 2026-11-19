import * as addresses from '@/lib/domain/addresses'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

const address =z.object({ label: z.enum(['home', 'work', 'other']), line1: z.string().trim().min(1, 'House / flat is required').max(200), line2: z.string().trim().max(200).optional(), landmark: z.string().trim().max(120).optional(), city: z.string().trim().min(1, 'City is required'), state: z.string().trim().min(1, 'State is required'), pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'), lat: z.number().optional(), lng: z.number().optional(), contactName: z.string().trim().min(1, 'Contact name is required').max(80), contactPhone: z.string().regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit mobile number'), isDefault: z.boolean().optional() }).strict()

export const PATCH = route({ body: address }, async ({ user, params, body }) => ({ data: await addresses.updateAddress(user.id, params.addressId, body) }))

export const DELETE = route({ successStatus: 204 }, async ({ user, params }) => {
  await addresses.deleteAddress(user.id, params.addressId)
  return { status: 204 }
})
