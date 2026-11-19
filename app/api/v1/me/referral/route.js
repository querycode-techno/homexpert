import * as referral from '@/lib/domain/referral'
import { route } from '@/lib/platform/route'

export const GET = route({}, async ({ user }) => ({ data: await referral.getReferral(user.id) }))
