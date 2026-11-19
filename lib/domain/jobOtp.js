import { hmac, safeEqual } from '@/lib/platform/ids'
import { required } from '@/lib/platform/env'

const WINDOW_MS = 15 * 60 * 1000

const counter = (now) => Math.floor(now / WINDOW_MS)
const codeFor = (requestId, phase, c) => String(parseInt(hmac(required('OTP_PEPPER'), `jobotp|${requestId}|${phase}|${c}`).slice(0, 8), 16) % 10000).padStart(4, '0')

/** The code the customer shows the Xpert; changes every 15 minutes. `phase` is `start` before the job begins and `finish` once it is in progress. */
export function currentJobOtp(requestId, phase, now = Date.now()) {
  const c = counter(now)
  return { phase, code: codeFor(requestId, phase, c), expiresAt: new Date((c + 1) * WINDOW_MS).toISOString() }
}

/** Accepts the current window and the previous one (so a code read just before rollover still works). */
export function verifyJobOtp(requestId, phase, given, now = Date.now()) {
  if (!/^[0-9]{4}$/.test(String(given || ''))) return false
  const c = counter(now)
  return [c, c - 1].some((w) => safeEqual(codeFor(requestId, phase, w), String(given)))
}
