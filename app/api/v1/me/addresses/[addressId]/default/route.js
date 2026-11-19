import * as addresses from '@/lib/domain/addresses'
import { route } from '@/lib/platform/route'

export const POST = route({ successStatus: 204 }, async ({ user, params }) => {
  await addresses.setDefaultAddress(user.id, params.addressId)
  return { status: 204 }
})
