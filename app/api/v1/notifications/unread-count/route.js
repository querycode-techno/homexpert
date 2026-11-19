import * as notifications from '@/lib/domain/notifications'
import { route } from '@/lib/platform/route'

export const GET = route({}, async ({ user }) => ({ data: await notifications.unreadCount(user.id) }))
