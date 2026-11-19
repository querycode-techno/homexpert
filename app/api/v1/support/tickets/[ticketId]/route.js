import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'

export const GET = route({}, async ({ user, params }) => ({ data: await support.getTicket(user.id, params.ticketId) }))
