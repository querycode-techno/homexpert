import * as catalog from '@/lib/domain/catalog'
import { route } from '@/lib/platform/route'

export const GET = route({ auth: 'none' }, async ({ params }) => ({ data: await catalog.getService(params.serviceId) }))
