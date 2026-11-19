import * as catalog from '@/lib/domain/catalog'
import { route } from '@/lib/platform/route'

export const GET = route({ auth: 'none' }, async ({ query }) => ({ data: await catalog.listCategories(query.cityId) }))
