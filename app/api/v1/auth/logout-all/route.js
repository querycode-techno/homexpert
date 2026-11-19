import * as identity from '@/lib/domain/identity'
import { route } from '@/lib/platform/route'

export const POST = route({ successStatus: 204 }, async ({ user }) => {
  await identity.logoutAll(user.id)
  return { status: 204 }
})
