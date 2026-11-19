import * as promo from '@/lib/domain/promo'
import { route } from '@/lib/platform/route'

export const GET = route({ auth: 'optional' }, async ({ user }) => ({ data: await promo.listOffers(user?.id) }))
