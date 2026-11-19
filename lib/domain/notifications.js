import { CustomerNotification } from '@/lib/models/booking'
import { Customer, Device } from '@/lib/models/customerAccount'
import { E } from '@/lib/platform/errors'
import { sendTransactionalSms } from '@/lib/platform/sms'
import { oid } from './catalog'

/**
 * Create an in-app notification (idempotent per `dedupeKey`) and push it to the customer's devices when the category is
 * enabled. Push failures never fail the caller; invalid tokens are pruned.
 */
export async function notify(customerId, { category, title, body, deepLink, dedupeKey, data, smsText }) {
  try {
    await CustomerNotification.create({ customerId, category, title, body, deepLink, dedupeKey })
  } catch (e) {
    if (e.code === 11000) {
      return false
    }
    throw e
  }
  try {
    const customer = await Customer.findById(customerId).select('preferences status phone').lean()
    if (!customer || customer.status === 'deleted' || customer.preferences?.notifications?.[category] === false) {
      return true
    }
    // FR-NOTIF-07: important messages (smsText given) fall back to SMS when no push can be delivered
    const fallback = async () => {
      if (smsText && customer.phone && !customer.phone.startsWith('deleted:')) await sendTransactionalSms(customer.phone, smsText)
    }
    const devices = await Device.find({ customerId, pushEnabled: true, fcmToken: { $ne: null } }).lean()
    if (devices.length === 0) {
      await fallback()
      return true
    }
    const { default: admin } = await import('@/lib/firebase/admin')
    const res = await admin.messaging().sendEachForMulticast({
      tokens: devices.map((d) => d.fcmToken),
      notification: { title, body },
      data: { deepLink: deepLink || '', category, ...(data || {}) },
      android: { priority: 'high', notification: { channelId: category } },
    })
    const dead = []
    res.responses.forEach((r, i) => {
      if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
        dead.push(devices[i].fcmToken)
      }
    })
    if (res.successCount === 0) {
      await fallback()
    }
    if (dead.length) {
      await Device.updateMany({ fcmToken: { $in: dead } }, { fcmToken: null, pushEnabled: false })
    }
  } catch (e) {
    process.stderr.write(JSON.stringify({ level: 'warn', message: 'push failed', error: String(e) }) + '\n')
    if (smsText) {
      const c = await Customer.findById(customerId).select('phone').lean().catch(() => null)
      if (c?.phone) await sendTransactionalSms(c.phone, smsText)
    }
  }
  return true
}

const toDto = (n) => ({ id: String(n._id), category: n.category, title: n.title, body: n.body, deepLink: n.deepLink, readAt: n.readAt || null, createdAt: n.createdAt })

export async function listNotifications(customerId, { cursor, limit = 20 }) {
  const filter = { customerId }
  if (cursor) {
    filter._id = { $lt: oid(cursor, 'cursor') }
  }
  const rows = await CustomerNotification.find(filter).sort({ _id: -1 }).limit(limit + 1).lean()
  const page = rows.slice(0, limit)
  return { items: page.map(toDto), nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null }
}

export async function markRead(customerId, { ids, all }) {
  if (!all && !ids?.length) {
    throw E.validation([{ field: 'ids', message: 'Provide ids or all=true' }])
  }
  const filter = { customerId, readAt: null }
  if (!all) {
    filter._id = { $in: ids.map((i) => oid(i, 'notification')) }
  }
  await CustomerNotification.updateMany(filter, { readAt: new Date() })
}

export const unreadCount = (customerId) => CustomerNotification.countDocuments({ customerId, readAt: null }).then((count) => ({ count }))
