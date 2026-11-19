import * as media from '@/lib/domain/media'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { successStatus: 201, limit: { name: 'upload', key: 'customer', limit: 40, windowSeconds: 3600 }, body: z.object({ purpose: z.enum(['booking_photo', 'review_photo', 'ticket_attachment', 'avatar']), contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4']), sizeBytes: z.number().int().min(1) }).strict() },
  async ({ user, body }) => ({ status: 201, data: await media.createUpload(user.id, body) }),
)
