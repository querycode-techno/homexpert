import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { successStatus: 201, idempotent: true, limit: { name: 'msg', key: 'customer', limit: 30, windowSeconds: 3600 }, body: z.object({ text: z.string().trim().min(1).max(1000), attachmentUploadIds: z.array(z.string()).max(3).optional() }).strict() },
  async ({ user, params, body }) => ({ status: 201, data: await support.postMessage(user.id, params.ticketId, body) }),
)
