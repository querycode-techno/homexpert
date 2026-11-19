import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'

export const POST = route({ successStatus: 204 }, async ({ user, deviceId }) => {
  await identity.logout(user.id, user.sessionId, deviceId)
  return { status: 204 }
})
