import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'

export const POST = route({}, async ({ user, params }) => ({ data: await support.closeTicket(user.id, params.ticketId) }))
