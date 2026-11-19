import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { ZodError } from 'zod'
import { connect } from './mongo'
import { ApiError, E } from './errors'
import { authenticate } from './auth'
import { enforce } from './rateLimit'
import { withIdempotency } from './idempotency'

const clientIp = (req) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

function envelope(data, meta, requestId) {
  return { success: true, data: data ?? null, meta: { requestId, serverTime: new Date().toISOString(), ...(meta || {}) } }
}

function errorResponse(err, requestId) {
  let e = err
  if (err instanceof ZodError) {
    e = E.validation(err.issues.map((i) => ({ field: i.path.join('.'), code: i.code, message: i.message })))
  } else if (!(err instanceof ApiError)) {
    // Never leak internals; the requestId lets support find the log line.
    process.stderr.write(JSON.stringify({ level: 'error', requestId, message: String(err?.stack || err) }) + '\n')
    e = E.internal()
  }
  const headers = { 'X-Request-Id': requestId }
  if (e.retryAfterSeconds) {
    headers['Retry-After'] = String(e.retryAfterSeconds)
  }
  return NextResponse.json(
    { success: false, error: { code: e.code, message: e.message, requestId, ...(e.details ? { details: e.details } : {}), ...(e.retryAfterSeconds ? { retryAfterSeconds: e.retryAfterSeconds } : {}) } },
    { status: e.status, headers },
  )
}

/**
 * Wraps a customer-API handler: request id → db → auth → rate limit → validation → (idempotency) → handler → envelope.
 *
 * options:
 *  auth: 'required' | 'optional' | 'none'
 *  body / query: zod schemas (unknown keys rejected via .strict())
 *  limit: { key: 'ip' | 'customer', limit, windowSeconds, name }
 *  idempotent: true  → requires Idempotency-Key (scoped to the customer + route)
 *  successStatus: number (default 200)
 */
export function route(options, handler) {
  const { auth = 'required', body: bodySchema, query: querySchema, limit, idempotent = false, successStatus = 200 } = options
  return async function handle(req, ctx) {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
    try {
      await connect()
      const user = auth === 'none' ? null : await authenticate(req)
      if (auth === 'required' && !user) {
        throw E.unauthorized()
      }
      const ip = clientIp(req)
      if (limit) {
        const subject = limit.key === 'customer' && user ? `c:${user.id}` : `ip:${ip}`
        await enforce(`${limit.name}:${subject}`, limit, 'Too many requests. Please slow down and try again shortly.')
      }
      let body
      if (bodySchema) {
        const text = await req.text()
        if (text.length > 64 * 1024) {
          throw E.badRequest('Request is too large.', 'PAYLOAD_TOO_LARGE')
        }
        let json
        try {
          json = text ? JSON.parse(text) : {}
        } catch {
          throw E.badRequest('Request body is not valid JSON.', 'INVALID_JSON')
        }
        body = bodySchema.parse(json)
      }
      const url = new URL(req.url)
      const query = querySchema ? querySchema.parse(Object.fromEntries(url.searchParams.entries())) : Object.fromEntries(url.searchParams.entries())
      const params = (await ctx?.params) || {}
      const call = {
        req,
        requestId,
        ip,
        user,
        body,
        query,
        params,
        deviceId: req.headers.get('x-device-id') || undefined,
        appVersion: req.headers.get('x-app-version') || undefined,
        locale: req.headers.get('accept-language') || 'en',
      }
      const exec = async () => {
        const r = await handler(call)
        return { status: r?.status ?? successStatus, data: r?.data ?? null, meta: r?.meta, headers: r?.headers }
      }
      const out = idempotent
        ? await withIdempotency({ customerId: user.id, route: `${req.method} ${url.pathname}`, key: req.headers.get('idempotency-key'), body }, exec)
        : await exec()
      const headers = { 'X-Request-Id': requestId, ...(out.headers || {}), ...(out.replayed ? { 'Idempotent-Replayed': 'true' } : {}) }
      if (out.status === 204 || out.status === 304) {
        return new NextResponse(null, { status: out.status, headers })
      }
      return NextResponse.json(envelope(out.data, out.meta, requestId), { status: out.status, headers })
    } catch (err) {
      return errorResponse(err, requestId)
    }
  }
}
