import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'

export const DELETE = route({ successStatus: 204 }, async ({ user, params }) => {
  await identity.unregisterDevice(user.id, params.deviceId)
  return { status: 204 }
})
