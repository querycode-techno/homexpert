import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'
import { z } from 'zod'

export const GET = route({ auth: 'none', query: z.object({ q: z.string().max(80).optional(), topicId: z.string().optional() }) }, async ({ query }) => ({ data: await support.listFaqs(query) }))
