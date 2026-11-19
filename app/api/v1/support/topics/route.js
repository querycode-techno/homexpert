import * as support from '@/lib/domain/support'
import { route } from '@/lib/platform/route'

export const GET = route({ auth: 'none' }, async () => ({ data: await support.listTopics() }))
