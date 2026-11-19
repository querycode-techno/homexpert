import * as config from '@/lib/domain/config'
import { route } from '@/lib/platform/route'

export const GET = route({ auth: 'none', limit: { name: 'cfg', key: 'ip', limit: 120, windowSeconds: 60 } }, async ({ req }) => ({
  data: await config.getAppConfig({ platform: req.headers.get('x-platform') === 'ios' ? 'ios' : 'android', appVersion: req.headers.get('x-app-version') }),
}))
