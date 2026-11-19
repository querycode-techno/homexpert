import { Customer, CustomerAddress, Device, Consent, DeletionRequest } from '@/lib/models/customerAccount'
import { OtpRequest, RefreshToken } from '@/lib/models/customerPlatform'
import { signAccessToken, ACCESS_TTL_SECONDS } from '@/lib/platform/auth'
import { enforce } from '@/lib/platform/rateLimit'
import { E } from '@/lib/platform/errors'
import { hmac, safeEqual, sha256, randomToken, otpCode } from '@/lib/platform/ids'
import { required } from '@/lib/platform/env'
import { consumeUploads, signedReadUrl } from './media'
import { applyReferralCode } from './referral'
import { sendOtpSms } from '@/lib/platform/sms'

const OTP_TTL_S = 300
const RESEND_AFTER_S = 30
const REFRESH_SLIDING_MS = 30 * 86400_000
const REFRESH_ABSOLUTE_MS = 90 * 86400_000

const pepper = () => required('OTP_PEPPER')
const phoneHash = (e164) => hmac(pepper(), `phone|${e164}`)
const e164 = (ten) => `+91${ten}`

/** Profile DTO including a freshly signed avatar URL (storage failures never break the profile). */
export async function presentCustomer(c) {
  const dto = toCustomer(c)
  if (c.avatarObjectKey) {
    try {
      dto.avatarUrl = await signedReadUrl(c.avatarObjectKey)
    } catch {
      dto.avatarUrl = null
    }
  }
  return dto
}

export function toCustomer(c) {
  return {
    id: String(c._id),
    phone: c.phone,
    name: c.name || '',
    email: c.email || null,
    gender: c.gender,
    avatarUrl: null,
    preferences: {
      language: c.preferences?.language || 'en',
      theme: c.preferences?.theme || 'system',
      notifications: {
        bookings: c.preferences?.notifications?.bookings ?? true,
        reminders: c.preferences?.notifications?.reminders ?? true,
        support: c.preferences?.notifications?.support ?? true,
        offers: c.preferences?.notifications?.offers ?? false,
      },
    },
    status: c.status === 'deleted' ? 'pending_deletion' : c.status,
    deletionScheduledFor: c.deletion?.scheduledFor || null,
    version: c.version,
  }
}

/**
 * OTP send. Layered throttles (doc 09 §6): per phone, per device, per IP. A response that reveals nothing about whether the
 * phone is registered is returned in all cases.
 */
export async function sendOtp({ phone, deviceId, ip }) {
  const target = e164(phone)
  await enforce(`otp:phone:${phoneHash(target)}`, { limit: 5, windowSeconds: 3600 }, 'Too many OTP requests for this number. Try again in an hour.', 'OTP_RATE_LIMITED')
  await enforce(`otp:device:${deviceId}`, { limit: 10, windowSeconds: 3600 }, 'Too many OTP requests from this device. Try again later.', 'OTP_RATE_LIMITED')
  await enforce(`otp:ip:${ip}`, { limit: 30, windowSeconds: 3600 }, 'Too many OTP requests from your network. Try again later.', 'OTP_RATE_LIMITED')

  const recent = await OtpRequest.findOne({ phoneHash: phoneHash(target), consumedAt: null, createdAt: { $gt: new Date(Date.now() - RESEND_AFTER_S * 1000) } }).sort({ createdAt: -1 })
  if (recent) {
    const wait = Math.ceil((recent.createdAt.getTime() + RESEND_AFTER_S * 1000 - Date.now()) / 1000)
    throw E.rateLimited(wait, `Please wait ${wait}s before requesting another code.`, 'OTP_RESEND_TOO_SOON')
  }

  const code = otpCode()
  const doc = await OtpRequest.create({ phoneHash: phoneHash(target), phone: target, codeHmac: 'pending', deviceId, ip, expiresAt: new Date(Date.now() + OTP_TTL_S * 1000) })
  doc.codeHmac = hmac(pepper(), `${target}|${code}|${doc._id}`)
  await doc.save()
  try {
    await sendOtpSms(target, code)
  } catch (e) {
    await OtpRequest.deleteOne({ _id: doc._id })
    throw e
  }
  return { otpRequestId: String(doc._id), expiresInSeconds: OTP_TTL_S, resendAfterSeconds: RESEND_AFTER_S }
}

async function issueTokens(customer, { deviceId, ip, userAgent, familyId = randomToken(12), sessionId = randomToken(12), absoluteExpiresAt }) {
  const refresh = randomToken(32)
  await RefreshToken.create({
    customerId: customer._id,
    sessionId,
    familyId,
    tokenHash: sha256(refresh),
    deviceId,
    ip,
    userAgent,
    expiresAt: new Date(Date.now() + REFRESH_SLIDING_MS),
    absoluteExpiresAt: absoluteExpiresAt || new Date(Date.now() + REFRESH_ABSOLUTE_MS),
  })
  return { accessToken: signAccessToken({ customerId: customer._id, sessionId, tokenVersion: customer.tokenVersion }), refreshToken: refresh, expiresInSeconds: ACCESS_TTL_SECONDS }
}

export async function registerDevice(customerId, d) {
  await Device.findOneAndUpdate(
    { deviceId: d.deviceId },
    { customerId, platform: d.platform, model: d.model, osVersion: d.osVersion, appVersion: d.appVersion, locale: d.locale, fcmToken: d.fcmToken || undefined, pushEnabled: !!d.fcmToken, lastSeenAt: new Date() },
    { upsert: true },
  )
}

/** Verify OTP (single-use, attempt-limited, constant-time) → create or load the customer → open a session. */
export async function verifyOtp({ otpRequestId, otp, name, email, device, ip, userAgent }) {
  const bad = (msg, code = 'OTP_INVALID') => E.unauthorized(msg, code)
  const req = await OtpRequest.findById(/^[a-f0-9]{24}$/.test(otpRequestId) ? otpRequestId : null)
  if (!req || req.consumedAt || req.expiresAt < new Date()) {
    throw bad('This code has expired. Please request a new one.', 'OTP_EXPIRED')
  }
  if (req.attempts >= req.maxAttempts) {
    throw E.rateLimited(900, 'Too many wrong codes. Please request a new code.', 'OTP_ATTEMPTS_EXCEEDED')
  }
  const claimed = await OtpRequest.findOneAndUpdate({ _id: req._id, attempts: { $lt: req.maxAttempts }, consumedAt: null }, { $inc: { attempts: 1 } }, { new: true })
  if (!claimed) {
    throw bad('This code is no longer valid. Please request a new one.', 'OTP_EXPIRED')
  }
  const expected = hmac(pepper(), `${req.phone}|${otp}|${req._id}`)
  if (!safeEqual(expected, req.codeHmac)) {
    const left = claimed.maxAttempts - claimed.attempts
    throw bad(left > 0 ? `That code is incorrect. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong codes. Please request a new code.', left > 0 ? 'OTP_INVALID' : 'OTP_ATTEMPTS_EXCEEDED')
  }
  const consumed = await OtpRequest.updateOne({ _id: req._id, consumedAt: null }, { consumedAt: new Date() })
  if (consumed.modifiedCount !== 1) {
    throw bad('This code was already used. Please request a new one.', 'OTP_EXPIRED')
  }

  let customer = await Customer.findOne({ phone: req.phone })
  const isNew = !customer
  if (customer?.status === 'suspended') {
    throw E.forbidden('Your account is suspended. Please contact support.', 'ACCOUNT_SUSPENDED')
  }
  if (!customer) {
    customer = await Customer.create({ phone: req.phone, phoneHash: phoneHash(req.phone), name: name || '', email: email || undefined })
  } else {
    customer.lastLoginAt = new Date()
    await customer.save()
  }
  await registerDevice(customer._id, device)
  const tokens = await issueTokens(customer, { deviceId: device.deviceId, ip, userAgent })
  return { tokens, customer: await presentCustomer(customer), isNewCustomer: isNew, requiredConsents: ['terms', 'privacy'] }
}

/** Rotating refresh tokens. Presenting an already-rotated token revokes the whole family (theft signal). */
export async function refresh({ refreshToken, ip, userAgent }) {
  const t = await RefreshToken.findOne({ tokenHash: sha256(refreshToken) })
  const expired = E.unauthorized('Your session has expired. Please log in again.', 'REFRESH_INVALID')
  if (!t || t.revokedAt || t.expiresAt < new Date() || t.absoluteExpiresAt < new Date()) {
    throw expired
  }
  if (t.rotatedAt) {
    await RefreshToken.updateMany({ familyId: t.familyId }, { revokedAt: new Date(), reuseDetectedAt: new Date() })
    throw expired
  }
  const claimed = await RefreshToken.findOneAndUpdate({ _id: t._id, rotatedAt: null, revokedAt: null }, { rotatedAt: new Date() })
  if (!claimed) {
    throw expired
  }
  const customer = await Customer.findById(t.customerId)
  if (!customer || customer.status === 'suspended') {
    throw expired
  }
  return issueTokens(customer, { deviceId: t.deviceId, ip, userAgent, familyId: t.familyId, sessionId: t.sessionId, absoluteExpiresAt: t.absoluteExpiresAt })
}

export async function logout(customerId, sessionId, deviceId) {
  await RefreshToken.updateMany({ customerId, sessionId, revokedAt: null }, { revokedAt: new Date() })
  if (deviceId) {
    await Device.updateOne({ customerId, deviceId }, { fcmToken: null, pushEnabled: false })
  }
}

/** Global sign-out: bump tokenVersion so every access token dies at once, and revoke all refresh tokens. */
export async function logoutAll(customerId) {
  await Customer.updateOne({ _id: customerId }, { $inc: { tokenVersion: 1 } })
  await RefreshToken.updateMany({ customerId, revokedAt: null }, { revokedAt: new Date() })
  await Device.updateMany({ customerId }, { fcmToken: null, pushEnabled: false })
}

export async function getMe(customerId) {
  const c = await Customer.findById(customerId)
  if (!c) {
    throw E.unauthorized()
  }
  return presentCustomer(c)
}

export async function updateMe(customerId, patch, ifMatch) {
  const c = await Customer.findById(customerId)
  if (ifMatch !== undefined && Number(ifMatch) !== c.version) {
    throw E.conflict('Your profile was updated on another device. Review the changes and try again.', 'VERSION_CONFLICT')
  }
  if (patch.name !== undefined) {
    c.name = patch.name.trim()
  }
  if (patch.email !== undefined) {
    c.email = patch.email || undefined
  }
  if (patch.gender !== undefined) {
    c.gender = patch.gender
  }
  if (patch.referralCode) {
    await applyReferralCode(customerId, patch.referralCode)
  }
  if (patch.avatarUploadId) {
    const [file] = await consumeUploads(customerId, 'avatar', [patch.avatarUploadId])
    c.avatarObjectKey = file.objectKey
  }
  c.version += 1
  await c.save()
  return presentCustomer(c)
}

export async function updatePreferences(customerId, prefs) {
  const set = {}
  if (prefs.language) {
    set['preferences.language'] = prefs.language
  }
  if (prefs.theme) {
    set['preferences.theme'] = prefs.theme
  }
  Object.entries(prefs.notifications || {}).forEach(([k, v]) => {
    // Transactional categories are always on (server-enforced; the app shows them locked).
    set[`preferences.notifications.${k}`] = ['bookings', 'reminders', 'support'].includes(k) ? true : v
  })
  const c = await Customer.findByIdAndUpdate(customerId, { $set: set }, { new: true })
  return toCustomer(c).preferences
}

export async function recordConsent(customerId, { type, version, granted }, { ip, deviceId }) {
  await Consent.create({ customerId, type, version, granted, ip, deviceId })
  if (type === 'marketing') {
    await Customer.updateOne({ _id: customerId }, { 'marketing.optedIn': granted, 'marketing.optedInAt': new Date(), 'preferences.notifications.offers': granted })
  }
}

export async function unregisterDevice(customerId, deviceId) {
  const r = await Device.deleteOne({ customerId, deviceId })
  if (r.deletedCount === 0) {
    throw E.notFound('That device was not found.')
  }
}

/** Deletion is scheduled with a 7-day grace period; in-progress bookings block it (server decides). */
export async function requestDeletion(customerId, { reasonCode, note }, activeBookings) {
  if (activeBookings > 0) {
    throw E.conflict('You have a booking in progress. You can delete your account once it is completed or cancelled.', 'DELETION_BLOCKED')
  }
  const scheduledFor = new Date(Date.now() + 7 * 86400_000)
  await DeletionRequest.updateMany({ customerId, status: 'pending' }, { status: 'cancelled' })
  await DeletionRequest.create({ customerId, scheduledFor, reason: [reasonCode, note].filter(Boolean).join(': ') })
  await Customer.updateOne({ _id: customerId }, { status: 'pending_deletion', 'deletion.requestedAt': new Date(), 'deletion.scheduledFor': scheduledFor, 'deletion.reason': reasonCode })
  return { scheduledFor: scheduledFor.toISOString() }
}

export async function cancelDeletion(customerId) {
  const r = await DeletionRequest.updateMany({ customerId, status: 'pending' }, { status: 'cancelled' })
  if (r.modifiedCount === 0) {
    throw E.notFound('There is no pending deletion to cancel.')
  }
  await Customer.updateOne({ _id: customerId }, { status: 'active', $unset: { deletion: 1 } })
}

export { CustomerAddress }
