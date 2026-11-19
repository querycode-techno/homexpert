import * as notifications from '@/lib/domain/notifications'
import { route } from '@/lib/platform/route'

// Accepts the request and queues it for the privacy team (fulfilment is manual in R1).
export const POST = route({ successStatus: 202, limit: { name: 'export', key: 'customer', limit: 3, windowSeconds: 86400 } }, async ({ user }) => {
  await notifications.notify(user.id, { category: 'support', title: 'Data export requested', body: 'We will email your data within 30 days.', dedupeKey: `export:${Date.now()}` })
  return { status: 202 }
})
