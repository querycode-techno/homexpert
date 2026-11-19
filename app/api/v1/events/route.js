import { z } from 'zod'
import { route } from '@/lib/platform/route'
import { AppEvent } from '@/lib/models/booking'

const event = z.object({ name: z.string().min(1).max(60), ts: z.string().datetime(), props: z.record(z.union([z.string().max(60), z.number(), z.boolean()])).optional() }).strict()

export const POST = route(
  { auth: 'optional', successStatus: 202, limit: { name: 'events', key: 'ip', limit: 120, windowSeconds: 60 }, body: z.object({ sessionId: z.string().max(60), events: z.array(event).max(50) }).strict() },
  async ({ body, user, deviceId, appVersion }) => {
    if (body.events.length) {
      await AppEvent.insertMany(body.events.map((e) => ({ customerId: user?.id, sessionId: body.sessionId, deviceId, appVersion, name: e.name, props: e.props, ts: new Date(e.ts) })), { ordered: false })
    }
    return { status: 202 }
  },
)
