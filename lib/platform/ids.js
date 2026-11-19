import crypto from 'crypto'

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url')
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')
export const hmac = (pepper, s) => crypto.createHmac('sha256', pepper).update(s).digest('hex')
export const safeEqual = (a, b) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}
/** 6-digit numeric OTP from a CSPRNG (uniform). */
export const otpCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')

/** HX-YYMMDD-XXXXX display id (unambiguous alphabet). */
export function displayId(now = new Date()) {
  const d = now.toISOString().slice(2, 10).replace(/-/g, '')
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i += 1) {
    s += alphabet[crypto.randomInt(0, alphabet.length)]
  }
  return `HX-${d}-${s}`
}
