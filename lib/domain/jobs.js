import Lead from '@/lib/models/lead'
import SupportTicket from '@/lib/models/supportTicket'
import { ServiceRequest, RequestEvent, Cart, CustomerNotification } from '@/lib/models/booking'
import { Customer, CustomerAddress, Device, DeletionRequest } from '@/lib/models/customerAccount'
import { RefreshToken } from '@/lib/models/customerPlatform'
import { statusOf, countActive } from './booking'
import { notify } from './notifications'
import { notifyStaffReply } from './support'
import { issueReferralRewards } from './referral'
import { Quote } from '@/lib/models/booking'

const FINAL = ['completed', 'cancelled']
const MESSAGES = {
  confirmed: ['Xpert assigned', 'An Xpert has been assigned to your booking.', true],
  scheduled: ['Service scheduled', 'Your service visit is scheduled.'],
  in_progress: ['Service started', 'Your Xpert has started the job.'],
  completed: ['Service completed', 'How did it go? Rate your Xpert.'],
  cancelled: ['Booking cancelled', 'Your booking was cancelled. Contact support if this is unexpected.'],
}

/** Detect vendor/admin-side status changes (made with the raw driver, so no model hooks fire) and tell the customer. */
async function syncStatuses() {
  const reqs = await ServiceRequest.find({ lastProjectedStatus: { $nin: FINAL } }).sort({ updatedAt: 1 }).limit(500)
  const leads = await Lead.find({ _id: { $in: reqs.map((r) => r.leadId) } }).select('status takenBy updatedAt completedAt finalAmountPaise actualServiceCost')
  const byId = Object.fromEntries(leads.map((l) => [String(l._id), l]))
  let changed = 0
  for (const r of reqs) {
    const lead = byId[String(r.leadId)]
    if (!lead) {
      continue
    }
    const next = statusOf(lead)
    if (next === r.lastProjectedStatus) {
      continue
    }
    const prev = r.lastProjectedStatus
    r.lastProjectedStatus = next
    r.version += 1
    await r.save()
    await RequestEvent.create({ requestId: r._id, type: 'status_changed', actor: { type: 'staff' }, from: prev, to: next })
    const m = MESSAGES[next]
    if (m) {
      await notify(r.customerId, { category: 'bookings', title: m[0], body: `${r.displayId}: ${m[1]}`, deepLink: `homesxpert://booking/${r._id}`, dedupeKey: `status:${r._id}:${next}`, smsText: m[2] ? `HomesXpert: an Xpert is assigned to booking ${r.displayId}.` : undefined })
    }
    changed += 1
  }
  return changed
}

/** 24-hour and 2-hour reminders for scheduled visits. */
async function sendReminders(now = new Date()) {
  let sent = 0
  for (const [key, hours, label] of [['rem24', 24, 'tomorrow'], ['rem2', 2, 'in about 2 hours']]) {
    const upper = new Date(now.getTime() + hours * 3600_000)
    const lower = new Date(now.getTime() + (hours - 1) * 3600_000)
    const reqs = await ServiceRequest.find({ 'slot.start': { $gte: lower, $lte: upper }, 'cancellation.at': null, lastProjectedStatus: { $nin: FINAL } }).limit(500)
    for (const r of reqs) {
      if (await notify(r.customerId, { category: 'reminders', title: 'Upcoming service', body: `${r.service.name} ${label}, ${r.slot.label}.`, deepLink: `homesxpert://booking/${r._id}`, dedupeKey: `${key}:${r._id}` })) {
        sent += 1
      }
    }
  }
  return sent
}

async function notifySupportReplies() {
  const tickets = await SupportTicket.find({ customerId: { $ne: null }, 'unreadCount.customer': { $gt: 0 }, status: { $ne: 'closed' } }).limit(200)
  for (const t of tickets) {
    await notifyStaffReply(t)
  }
  return tickets.length
}

/** Process deletion requests whose grace period ended. Blocked while a booking is active. */
async function processDeletions(now = new Date()) {
  const due = await DeletionRequest.find({ status: 'pending', scheduledFor: { $lte: now } }).limit(50)
  let done = 0
  for (const d of due) {
    if ((await countActive(d.customerId)) > 0) {
      d.status = 'blocked'
      d.blockReason = 'active_booking'
      await d.save()
      continue
    }
    d.status = 'processing'
    await d.save()
    await CustomerAddress.deleteMany({ customerId: d.customerId })
    await Device.deleteMany({ customerId: d.customerId })
    await Cart.deleteMany({ customerId: d.customerId })
    await RefreshToken.updateMany({ customerId: d.customerId, revokedAt: null }, { revokedAt: new Date() })
    // Anonymise the profile. Booking and invoice records are retained for legal reasons, de-linked from personal data.
    await Customer.updateOne(
      { _id: d.customerId },
      { status: 'deleted', name: 'Deleted user', phone: `deleted:${d.customerId}`, phoneHash: `deleted:${d.customerId}`, $unset: { email: 1, gender: 1, avatarMediaId: 1, defaultAddressId: 1 }, $inc: { tokenVersion: 1 } },
    )
    d.status = 'completed'
    await d.save()
    done += 1
  }
  return done
}

/** FR-CART-05: abandoned-cart nudge (24 h idle), only for customers who opted in to marketing; max 2 per 7 days. */
async function recoverCarts(now = new Date()) {
  const idleFrom = new Date(now.getTime() - 72 * 3600_000)
  const idleTo = new Date(now.getTime() - 24 * 3600_000)
  const carts = await Cart.find({ status: 'active', 'lines.0': { $exists: true }, lastActivityAt: { $gte: idleFrom, $lte: idleTo } }).limit(300)
  let sent = 0
  for (const c of carts) {
    const customer = await Customer.findById(c.customerId).select('marketing status').lean()
    if (!customer || customer.status !== 'active' || !customer.marketing?.optedIn) {
      continue
    }
    const weekAgo = new Date(now.getTime() - 7 * 86400_000)
    const recent = await CustomerNotification.countDocuments({ customerId: c.customerId, dedupeKey: /^cart-recovery:/, createdAt: { $gte: weekAgo } })
    if (recent >= 2) {
      continue
    }
    if (await notify(c.customerId, { category: 'offers', title: 'You left something in your cart', body: 'Your selected services are waiting. Book now and pay after the service.', deepLink: 'homesxpert://cart', dedupeKey: `cart-recovery:${c._id}:${now.toISOString().slice(0, 10)}` })) {
      sent += 1
    }
  }
  return sent
}

/** A final-price request the customer ignored for 24 h is escalated: payment goes to "disputed" so ops pick it up. */
async function expireQuotes(now = new Date()) {
  const stale = await Quote.find({ status: 'pending', expiresAt: { $lt: now } }).limit(100)
  for (const q of stale) {
    q.status = 'expired'
    await q.save()
    await Lead.updateOne({ _id: q.leadId }, { $set: { quotePending: false, appPaymentStatus: 'disputed' } })
    await ServiceRequest.updateOne({ _id: q.requestId }, { 'payment.status': 'disputed' })
  }
  return stale.length
}

/** Idempotent; safe to run every minute from any scheduler. */
export async function runJobs() {
  return {
    statusChanges: await syncStatuses(),
    reminders: await sendReminders(),
    supportReplies: await notifySupportReplies(),
    cartRecovery: await recoverCarts(),
    referralRewards: await issueReferralRewards(),
    expiredQuotes: await expireQuotes(),
    deletions: await processDeletions(),
  }
}
