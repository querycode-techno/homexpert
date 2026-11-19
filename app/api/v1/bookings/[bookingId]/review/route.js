import * as reviews from '@/lib/domain/reviews'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const POST = route(
  { successStatus: 201, idempotent: true, body: z.object({ rating: z.number().int().min(1).max(5), tags: z.array(z.string().max(30)).max(6).optional(), text: z.string().max(500).optional(), photoUploadIds: z.array(z.string()).max(3).optional() }).strict() },
  async ({ user, params, body }) => ({ status: 201, data: await reviews.submitReview(user.id, params.bookingId, body) }),
)
