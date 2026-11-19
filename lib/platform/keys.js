import crypto from 'crypto'
import { required } from './env'

/**
 * Customer token keys (ES256). Rotation: add the new key pair, point ACTIVE_KID at it, and keep the old public key in
 * CUSTOMER_JWT_PUBLIC_KEYS until its last access token (15 min) / invoice link (10 min) has expired.
 *
 *   CUSTOMER_JWT_ACTIVE_KID    e.g. "2026-11"
 *   CUSTOMER_JWT_PRIVATE_KEY   PEM (EC P-256, PKCS8); "\n" escapes are accepted
 *   CUSTOMER_JWT_PUBLIC_KEYS   optional JSON { "<kid>": "<PEM>" } for retired keys (the active key's public half is derived)
 */
const pem = (v) => v.replace(/\\n/g, '\n')
let cached

function load() {
  if (cached) return cached
  const kid = required('CUSTOMER_JWT_ACTIVE_KID')
  const privateKey = crypto.createPrivateKey(pem(required('CUSTOMER_JWT_PRIVATE_KEY')))
  if (privateKey.asymmetricKeyType !== 'ec' || privateKey.asymmetricKeyDetails?.namedCurve !== 'prime256v1') {
    throw new Error('CUSTOMER_JWT_PRIVATE_KEY must be an EC P-256 key')
  }
  const publics = { [kid]: crypto.createPublicKey(privateKey) }
  const extra = process.env.CUSTOMER_JWT_PUBLIC_KEYS ? JSON.parse(process.env.CUSTOMER_JWT_PUBLIC_KEYS) : {}
  Object.entries(extra).forEach(([k, v]) => {
    if (!publics[k]) publics[k] = crypto.createPublicKey(pem(v))
  })
  cached = { kid, privateKey, publics }
  return cached
}

export const activeSigningKey = () => {
  const { kid, privateKey } = load()
  return { kid, key: privateKey }
}

/** Public key for a token's `kid`, or null when unknown (retired and removed). */
export const verificationKey = (kid) => load().publics[kid] || null
