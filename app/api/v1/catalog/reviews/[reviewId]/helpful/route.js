import * as reviews from '@/lib/domain/reviews'
import { route } from '@/lib/platform/route'

export const POST = route({ limit: { name: 'helpful', key: 'customer', limit: 60, windowSeconds: 600 } }, async ({ user, params }) => ({ data: await reviews.toggleHelpful(user.id, params.reviewId) }))
