import { IdempotencyKey } from '@/lib/models/customerPlatform'
import { sha256 } from './ids'
import { E } from './errors'

const TTL_MS = 24 * 3600 * 1000

/**
 * Replays the stored response for the same (customer, route, key, body); a different body with the same key is 409.
 * `run` executes at most once per key; concurrent duplicates get 409 IDEMPOTENCY_IN_PROGRESS.
 */
export async function withIdempotency({ customerId, route, key, body }, run) {
  if (!key) {
    throw E.badRequest('Idempotency-Key header is required for this request.', 'IDEMPOTENCY_KEY_REQUIRED')
  }
  const requestHash = sha256(JSON.stringify(body ?? {}))
  let doc
  try {
    doc = await IdempotencyKey.create({ customerId, route, key, requestHash, expiresAt: new Date(Date.now() + TTL_MS) })
  } catch (e) {
    if (e.code !== 11000) {
      throw e
    }
    const existing = await IdempotencyKey.findOne({ customerId, route, key })
    if (!existing) {
      throw e
    }
    if (existing.requestHash !== requestHash) {
      throw E.conflict('This request key was already used for a different request.', 'IDEMPOTENCY_KEY_REUSED')
    }
    if (existing.status !== 'done') {
      throw E.conflict('This request is already being processed.', 'IDEMPOTENCY_IN_PROGRESS')
    }
    return { status: existing.responseStatus, data: existing.response, replayed: true }
  }
  try {
    const out = await run()
    await IdempotencyKey.updateOne({ _id: doc._id }, { status: 'done', responseStatus: out.status, response: out.data })
    return { ...out, replayed: false }
  } catch (e) {
    // A failed attempt must not poison the key: release it so the client can retry.
    await IdempotencyKey.deleteOne({ _id: doc._id })
    throw e
  }
}
