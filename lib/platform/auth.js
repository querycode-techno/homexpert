import jwt from 'jsonwebtoken'
import { activeSigningKey, verificationKey } from './keys'
import { E } from './errors'
import { Customer } from '@/lib/models/customerAccount'

export const ISSUER = 'api.homesxpert.in'
export const AUDIENCE = 'hx-customer'
export const ACCESS_TTL_SECONDS = 15 * 60

export function signAccessToken({ customerId, sessionId, tokenVersion }) {
  const { kid, key } = activeSigningKey()
  return jwt.sign({ sid: sessionId, ver: tokenVersion }, key, {
    algorithm: 'ES256',
    keyid: kid,
    subject: String(customerId),
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_TTL_SECONDS,
  })
}

/** Verifies audience/issuer (vendor/admin tokens are rejected), then checks the account's tokenVersion and status. */
/** Short-lived (10 min) link token for a customer's invoice download; the URL itself is the credential. */
export function signInvoiceToken(requestId) {
  const { kid, key } = activeSigningKey()
  return jwt.sign({}, key, { algorithm: 'ES256', keyid: kid, subject: String(requestId), issuer: ISSUER, audience: 'hx-invoice', expiresIn: 600 })
}

/** Verify a token signed by one of our ES256 keys (looked up by `kid`). */
export function verifyToken(token, { audience }) {
  const decoded = jwt.decode(token, { complete: true })
  const key = decoded?.header?.kid ? verificationKey(decoded.header.kid) : null
  if (!key) {
    throw new jwt.JsonWebTokenError('unknown key')
  }
  return jwt.verify(token, key, { algorithms: ['ES256'], issuer: ISSUER, audience })
}

export async function authenticate(req) {
  const header = req.headers.get('authorization') || ''
  const m = /^Bearer (.+)$/i.exec(header)
  if (!m) {
    return null
  }
  let claims
  try {
    claims = verifyToken(m[1], { audience: AUDIENCE })
  } catch (e) {
    throw E.unauthorized('Your session has expired. Please log in again.', e.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID')
  }
  const customer = await Customer.findById(claims.sub).select('status tokenVersion')
  if (!customer || customer.tokenVersion !== claims.ver) {
    throw E.unauthorized('Your session has ended. Please log in again.', 'TOKEN_REVOKED')
  }
  if (customer.status === 'suspended') {
    throw E.forbidden('Your account is suspended. Please contact support.', 'ACCOUNT_SUSPENDED')
  }
  return { id: String(customer._id), sessionId: claims.sid, status: customer.status }
}
