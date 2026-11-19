import { isProd } from './env'

/**
 * SMS provider abstraction. Production requires a configured provider (fails closed). Provider: MSG91 Flow API (DLT template id
 * in MSG91_OTP_TEMPLATE_ID). Outside production with no provider configured the OTP is written to the server log so the flow can
 * be exercised locally; that path is unreachable when NODE_ENV=production.
 */
export async function sendOtpSms(phone, code) {
  const key = process.env.MSG91_AUTH_KEY
  const template = process.env.MSG91_OTP_TEMPLATE_ID
  if (!key || !template) {
    if (isProd()) {
      throw new Error('SMS provider is not configured (MSG91_AUTH_KEY / MSG91_OTP_TEMPLATE_ID)')
    }
    process.stdout.write(JSON.stringify({ level: 'info', message: 'OTP (non-production, no SMS provider)', phone, code }) + '\n')
    return { providerId: 'local-log' }
  }
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { authkey: key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ template_id: template, short_url: '0', recipients: [{ mobiles: phone.replace('+', ''), otp: code, ...(process.env.OTP_SMS_APP_HASH ? { hash: process.env.OTP_SMS_APP_HASH } : {}) }] }),
  })
  if (!res.ok) {
    throw new Error(`SMS provider error ${res.status}`)
  }
  const json = await res.json().catch(() => ({}))
  return { providerId: json.request_id || 'msg91' }
}

/**
 * Transactional SMS (DLT template with one variable) used when a push cannot be delivered. Never throws: a failed fallback
 * must not fail the business action that triggered it.
 */
export async function sendTransactionalSms(phone, text) {
  const key = process.env.MSG91_AUTH_KEY
  const template = process.env.MSG91_NOTIF_TEMPLATE_ID
  try {
    if (!key || !template) {
      if (!isProd()) process.stdout.write(JSON.stringify({ level: 'info', message: 'SMS fallback (non-production, no provider)', phone, text }) + '\n')
      return false
    }
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ template_id: template, short_url: '0', recipients: [{ mobiles: phone.replace('+', ''), var1: text.slice(0, 120) }] }),
    })
    return res.ok
  } catch (e) {
    process.stderr.write(JSON.stringify({ level: 'warn', message: 'SMS fallback failed', error: String(e) }) + '\n')
    return false
  }
}
