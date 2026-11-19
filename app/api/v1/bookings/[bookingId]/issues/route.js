import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { successStatus: 201, idempotent: true, limit: { name: 'issue', key: 'customer', limit: 10, windowSeconds: 3600 }, body: z.object({ type: z.enum(['quality', 'no_show', 'damage', 'overcharge', 'payment', 'safety', 'other']), description: z.string().trim().min(5, 'Please describe the problem').max(1000), attachmentUploadIds: z.array(z.string()).max(3).optional() }).strict() },
  async ({ user, params, body }) => ({ status: 201, data: await support.reportIssue(user.id, params.bookingId, body) }),
)
