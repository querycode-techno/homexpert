import { RateCounter } from '@/lib/models/customerPlatform'
import { E } from './errors'

/** Fixed-window counter in Mongo. `key` should already include the dimension (ip / phone / customer). */
export async function hit(key, { limit, windowSeconds }) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000))
  const doc = await RateCounter.findOneAndUpdate(
    { key: `${key}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowSeconds * 1000 + 60_000) } },
    { upsert: true, new: true },
  )
  const resetIn = Math.max(1, (bucket + 1) * windowSeconds - Math.floor(Date.now() / 1000))
  return { allowed: doc.count <= limit, remaining: Math.max(0, limit - doc.count), resetIn }
}

export async function enforce(key, rule, message, code) {
  const r = await hit(key, rule)
  if (!r.allowed) {
    throw E.rateLimited(r.resetIn, message, code)
  }
}
