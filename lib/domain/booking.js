import crypto from 'crypto'
import Lead from '@/lib/models/lead'
import User from '@/lib/models/user'
import { Cart, ServiceRequest, RequestEvent, Review, Quote } from '@/lib/models/booking'
import { withTransaction } from '@/lib/platform/mongo'
import { E } from '@/lib/platform/errors'
import { displayId } from '@/lib/platform/ids'
import { money } from '@/lib/platform/money'
import { oid, checkServiceability } from './catalog'
import { getOwnedAddress } from './addresses'
import { resolveCart } from './cart'
import { price, PAYMENT_NOTE } from './pricing'
import { resolveSlot } from './slots'
import { loadConfig } from './config'
import { currentJobOtp } from './jobOtp'
import { notifyMatchedVendorsForNewLead } from '@/lib/services/leadVendorNotificationService'
import { createTicket } from './support'
import { evaluate as evaluatePromo, redeem as redeemPromo } from './promo'

/** Lead statuses (vendor/admin workflow, 15) → customer projection (7). Pure and exhaustive. */
export const LEAD_TO_STATUS = {
  pending: 'submitted',
  available: 'matching',
  unassigned: 'matching',
  not_interested: 'matching',
  assigned: 'confirmed',
  taken: 'confirmed',
  contacted: 'confirmed',
  interested: 'confirmed',
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  converted: 'completed',
  cancelled: 'cancelled',
  expired: 'cancelled',
  refund_requested: 'completed', // vendor-side billing state; hidden from the customer
}
const LABELS = {
  submitted: 'Request received',
  matching: 'Finding your Xpert',
  confirmed: 'Xpert assigned',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
export const LEADS_FOR_TAB = {
  upcoming: ['pending', 'available', 'unassigned', 'not_interested', 'assigned', 'taken', 'contacted', 'interested', 'scheduled', 'in_progress'],
  past: ['completed', 'converted', 'refund_requested'],
  cancelled: ['cancelled', 'expired'],
}
export const ACTIVE_LEADS = LEADS_FOR_TAB.upcoming
const ORDER = ['submitted', 'matching', 'confirmed', 'scheduled', 'in_progress', 'completed']

export const statusOf = (lead) => LEAD_TO_STATUS[lead.status] || 'submitted'

function paymentOf(req, lead, cfg, now = new Date()) {
  const stored = req.payment?.status || 'pending'
  const finalPaise = lead.finalAmountPaise ?? req.payment?.finalAmountPaise ?? (lead.actualServiceCost ? Math.round(lead.actualServiceCost * 100) : null)
  let status = stored
  if (stored === 'pending' && ['collected', 'disputed', 'waived'].includes(lead.appPaymentStatus)) {
    status = lead.appPaymentStatus
  } else if (stored === 'pending' && !lead.quotePending && statusOf(lead) === 'completed' && finalPaise != null) {
    status = 'collected'
    const at = lead.paymentCollectedAt || lead.completedAt
    if (at && now.getTime() - new Date(at).getTime() > cfg.payment.autoConfirmHours * 3600_000) {
      status = 'confirmed' // auto-confirm after the dispute window
    }
  }
  const labels = { pending: 'Pay after service', collected: 'Payment received by Xpert', confirmed: 'Payment confirmed', disputed: 'Payment under review', waived: 'Waived' }
  return {
    mode: 'pay_after_service',
    status,
    estimate: req.pricing?.total ? req.pricing.total : undefined,
    finalAmount: finalPaise != null ? money(finalPaise) : undefined,
    statusLabel: labels[status],
  }
}

function actionsOf(status, req, lead, vendor, cfg, hasReview, quote = null, now = new Date()) {
  const slotStart = req.slot?.start ? new Date(req.slot.start) : null
  const cancellable = ['submitted', 'matching', 'confirmed', 'scheduled'].includes(status)
  const inFreeWindow = !slotStart || slotStart.getTime() - now.getTime() >= cfg.cancellation.freeWindowMinutes * 60_000
  const fee = cancellable && !inFreeWindow && cfg.cancellation.lateFeePaise > 0 ? money(cfg.cancellation.lateFeePaise) : undefined
  const pay = paymentOf(req, lead, cfg, now)
  return {
    canCancel: cancellable,
    cancellationFee: fee,
    cancelBlockedReason: status === 'in_progress' ? 'The job has started and can no longer be cancelled here. Please contact support.' : null,
    canReschedule: ['submitted', 'matching', 'confirmed', 'scheduled'].includes(status),
    canReview: status === 'completed' && !hasReview,
    canReportIssue: status !== 'cancelled',
    canAcknowledgePayment: pay.status === 'collected',
    canContactXpert: !!vendor?.phone && ['confirmed', 'scheduled', 'in_progress'].includes(status),
    requiresQuoteResponse: !!quote,
  }
}

function timelineOf(status, req, lead) {
  const ts = {
    submitted: req.createdAt,
    matching: lead.availableToVendors?.assignedAt,
    confirmed: lead.takenAt || lead.contactedAt,
    scheduled: lead.scheduledAt,
    in_progress: status === 'in_progress' ? lead.updatedAt : null,
    completed: lead.completedAt || lead.convertedAt,
  }
  if (status === 'cancelled') {
    return [
      { status: 'submitted', label: LABELS.submitted, at: ts.submitted, state: 'done' },
      { status: 'cancelled', label: LABELS.cancelled, at: req.cancellation?.at || lead.cancelledAt || null, state: 'current', note: req.cancellation?.note || null },
    ]
  }
  const idx = ORDER.indexOf(status)
  return ORDER.map((s, i) => ({ status: s, label: LABELS[s], at: ts[s] || null, state: i < idx ? 'done' : i === idx ? 'current' : 'upcoming' }))
}

function summaryOf(req, lead) {
  const status = statusOf(lead)
  const sub = []
  if (lead.quotePending) {
    sub.push('quote_pending')
  }
  if (req.payment?.status === 'disputed') {
    sub.push('issue_open')
  }
  return {
    id: String(req._id),
    displayId: req.displayId,
    checkoutId: req.checkoutId,
    serviceName: req.service?.name,
    imageUrl: req.service?.imageUrl,
    status,
    statusLabel: LABELS[status],
    substatus: sub[0] || null,
    slotStart: req.slot?.start || null,
    slotLabel: req.slot ? `${new Date(req.slot.start).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}, ${req.slot.label}` : undefined,
    total: req.pricing?.total,
    createdAt: req.createdAt,
  }
}

async function detailOf(req, lead) {
  const cfg = await loadConfig()
  const status = statusOf(lead)
  const vendor = lead.takenBy ? await User.findById(lead.takenBy).select('name phone profileImage').lean() : null
  const review = req.reviewId ? await Review.findById(req.reviewId).lean() : null
  const quote = lead.quotePending ? await Quote.findOne({ requestId: req._id, status: 'pending' }).lean() : null
  const revealed = ['confirmed', 'scheduled', 'in_progress', 'completed'].includes(status)
  const summary = summaryOf(req, lead)
  return {
    ...summary,
    lines: req.lines.map((l) => ({ lineId: l.lineId, serviceId: String(req.service.id), subServiceId: l.subServiceKey, serviceName: req.service.name, subServiceName: l.name, quantity: l.quantity, lineTotal: money(l.lineTotalPaise) })),
    address: req.addressSnapshot ? { id: String(req.addressId), ...req.addressSnapshot } : undefined,
    notes: req.notes,
    photos: [],
    pricing: req.pricing,
    payment: paymentOf(req, lead, cfg),
    xpert: vendor && revealed ? { name: vendor.name, photoUrl: vendor.profileImage || null, verified: true, contactPhone: null } : null,
    timeline: timelineOf(status, req, lead),
    actions: (() => {
      const a = actionsOf(status, req, lead, vendor, cfg, !!review, quote)
      return a
    })(),
    quote: quote ? { id: String(quote._id), estimate: quote.estimatePaise != null ? money(quote.estimatePaise) : undefined, final: money(quote.finalPaise), note: quote.note, expiresAt: quote.expiresAt } : null,
    review: review ? { id: String(review._id), rating: review.rating, tags: review.tags, text: review.text, authorName: review.authorName, createdAt: review.createdAt } : null,
    warrantyUntil: null,
    version: req.version,
    _vendorPhone: vendor?.phone,
  }
}

/** The contact number is only exposed when the server says the customer may contact the Xpert (BR-09). */
function publicDetail(d) {
  const { _vendorPhone, ...rest } = d
  if (rest.xpert && rest.actions.canContactXpert) {
    rest.xpert = { ...rest.xpert, contactPhone: _vendorPhone }
  }
  return rest
}

async function load(customerId, bookingId) {
  const req = await ServiceRequest.findOne({ _id: oid(bookingId, 'booking'), customerId })
  if (!req) {
    throw E.notFound('We could not find that booking.')
  }
  const lead = await Lead.findById(req.leadId)
  if (!lead) {
    throw E.notFound('We could not find that booking.')
  }
  return { req, lead }
}

export async function getBooking(customerId, bookingId) {
  const { req, lead } = await load(customerId, bookingId)
  return publicDetail(await detailOf(req, lead))
}

export async function listBookings(customerId, { tab = 'upcoming', cursor, limit = 20 }) {
  const filter = { customerId, source: 'user_app', status: { $in: LEADS_FOR_TAB[tab] } }
  if (cursor) {
    filter._id = { $lt: oid(cursor, 'cursor') }
  }
  const leads = await Lead.find(filter).sort({ _id: -1 }).limit(limit + 1)
  const page = leads.slice(0, limit)
  const reqs = await ServiceRequest.find({ leadId: { $in: page.map((l) => l._id) } })
  const byLead = Object.fromEntries(reqs.map((r) => [String(r.leadId), r]))
  return {
    items: page.filter((l) => byLead[String(l._id)]).map((l) => summaryOf(byLead[String(l._id)], l)),
    nextCursor: leads.length > limit ? String(page[page.length - 1]._id) : null,
  }
}

export async function countActive(customerId) {
  return Lead.countDocuments({ customerId, source: 'user_app', status: { $in: ACTIVE_LEADS } })
}

const event = (requestId, type, actor, from, to, meta) => ({ requestId, type, actor, from, to, meta, at: new Date() })

/**
 * Checkout (doc 08 §5): validate → re-price from the live catalogue → create one lead + one service_request per cart line
 * (grouped by checkoutId) → clear the cart, all in ONE transaction. Idempotency is applied by the route wrapper.
 */
export async function checkout(customerId, input) {
  const cart = await Cart.findOne({ customerId })
  if (!cart || cart.lines.length === 0) {
    throw E.conflict('Your cart is empty.', 'CART_EMPTY')
  }
  const { resolved, issues } = await resolveCart(cart)
  const blocking = issues.find((i) => i.severity === 'blocking')
  if (blocking) {
    throw E.conflict(blocking.message, 'CART_HAS_ISSUES')
  }
  const address = await getOwnedAddress(customerId, input.addressId)
  const svc = await checkServiceability(address.pincode)
  if (!svc.serviceable) {
    throw E.conflict(svc.message, 'AREA_NOT_SERVICEABLE')
  }
  const slot = await resolveSlot(input.slotId, { cityName: address.city })

  // Promo: validated against the whole cart, then split across the per-line bookings in proportion to their value
  const lineValue = resolved.map((r) => (r.unitPaise == null ? 0 : r.unitPaise * r.line.quantity))
  const cartSubtotal = lineValue.reduce((a, b) => a + b, 0)
  let promoInfo = null
  if (cart.promoCode) {
    try {
      promoInfo = await evaluatePromo(cart.promoCode, { customerId, subtotalPaise: cartSubtotal })
    } catch (e) {
      throw E.conflict(e.message, 'PROMO_INVALID')
    }
  }
  let left = promoInfo?.discountPaise || 0
  const shares = lineValue.map((v, i) => {
    if (!promoInfo) return 0
    const share = i === lineValue.length - 1 ? left : Math.floor((promoInfo.discountPaise * v) / (cartSubtotal || 1))
    left -= share
    return share
  })
  const priced = await Promise.all(resolved.map((r, i) => price([{ unitPaise: r.unitPaise, quantity: r.line.quantity, taxClass: r.taxClass }], { discountPaise: shares[i] }).then((p) => ({ r, p, share: shares[i] }))))
  if (input.expectedTotal) {
    const sum = priced.reduce((s, x) => s + x.p.total.amountPaise, 0)
    if (sum !== input.expectedTotal.amountPaise) {
      throw E.conflict(`The price changed to ${money(sum).display}. Please review your cart and confirm again.`, 'PRICE_CHANGED')
    }
  }
  const checkoutId = crypto.randomBytes(8).toString('hex')
  const addressText = [address.line1, address.line2, address.landmark, `${address.city}, ${address.state} ${address.pincode}`].filter(Boolean).join(', ')
  const snapshot = { label: address.label, line1: address.line1, line2: address.line2, landmark: address.landmark, city: address.city, state: address.state, pincode: address.pincode, contactName: address.contactName, contactPhone: address.contactPhone }

  const bookings = await withTransaction(async (session) => {
    const created = []
    if (promoInfo) {
      await redeemPromo(promoInfo.promo, { customerId, checkoutId, discountPaise: promoInfo.discountPaise }, session)
    }
    for (const { r, p, share } of priced) {
      const unit = r.unitPaise
      const leadDoc = new Lead({
        customerName: address.contactName,
        customerPhone: address.contactPhone,
        service: r.svc.name,
        selectedService: r.svc.name,
        selectedSubService: r.sub.name,
        // The team's vendor matching works on city + state, so they must be set on every app-created lead
        city: address.city,
        state: address.state,
        quantity: r.line.quantity,
        paymentMode: 'pay_after_service',
        address: addressText,
        description: input.notes?.trim() || `${r.sub.name} × ${r.line.quantity} (booked via the HomesXpert app)`,
        price: unit == null ? undefined : unit / 100,
        getQuote: unit == null,
        additionalNotes: input.urgency === 'urgent' ? 'URGENT: customer asked for the earliest possible visit.' : undefined,
        preferredDate: new Date(slot.start),
        preferredTime: slot.label,
        status: 'pending',
        source: 'user_app',
        customerId,
        checkoutId,
        estimatePaise: p.total.amountPaise,
        visibility: { revealCustomerContact: false },
        slot: { start: new Date(slot.start), end: new Date(slot.end) },
      })
      const [request] = await ServiceRequest.create(
        [
          {
            displayId: displayId(),
            checkoutId,
            customerId,
            leadId: leadDoc._id,
            service: { id: r.svc._id, name: r.svc.name, categoryId: r.svc.categoryId, imageUrl: r.svc.imageUrl },
            lines: [{ lineId: r.line.lineId, subServiceKey: r.sub.key, name: r.sub.name, quantity: r.line.quantity, unitPaise: unit ?? 0, lineTotalPaise: unit == null ? 0 : unit * r.line.quantity }],
            addressSnapshot: snapshot,
            addressId: address._id,
            slot: { id: slot.id, start: new Date(slot.start), end: new Date(slot.end), label: slot.label },
            notes: input.notes,
            urgency: input.urgency || 'normal',
            mediaIds: (input.photoUploadIds || []).map((i) => oid(i, 'upload')),
            pricing: p,
            promo: promoInfo ? { code: promoInfo.promo.code, discountPaise: share } : undefined,
            lastProjectedStatus: 'submitted',
          },
        ],
        { session },
      )
      leadDoc.requestId = request._id
      await leadDoc.save({ session })
      await RequestEvent.create([event(request._id, 'created', { type: 'customer', id: String(customerId) }, null, 'submitted', { checkoutId })], { session })
      created.push(request)
    }
    await Cart.updateOne({ customerId }, { lines: [], $unset: { promoCode: 1 }, $inc: { version: 1 }, lastActivityAt: new Date() }, { session })
    return created
  })

  // Tell matching vendors about the new leads (the team's existing matcher; never fails the checkout)
  for (const b of bookings) {
    const lead = await Lead.findById(b.leadId).select('service selectedService address city state customerName').lean()
    if (lead) {
      await notifyMatchedVendorsForNewLead(lead)
    }
  }

  return {
    checkoutId,
    bookings: bookings.map((b) => ({ id: String(b._id), displayId: b.displayId, checkoutId, serviceName: b.service.name, imageUrl: b.service.imageUrl, status: 'submitted', statusLabel: LABELS.submitted, slotStart: b.slot.start, slotLabel: b.slot.label, total: b.pricing.total, createdAt: b.createdAt })),
    nextSteps: ['We find the best Xpert for your job.', 'You get an update as soon as an Xpert is assigned.', PAYMENT_NOTE],
  }
}

const CANCEL_REASONS = ['change', 'other', 'wrong']

export async function cancelBooking(customerId, bookingId, { reasonCode, note }) {
  const { req, lead } = await load(customerId, bookingId)
  const status = statusOf(lead)
  if (status === 'in_progress') {
    throw E.forbidden('The job has started and can no longer be cancelled here. Please contact support.', 'CANCEL_BLOCKED')
  }
  if (['completed', 'cancelled'].includes(status)) {
    throw E.forbidden('This booking can no longer be cancelled.', 'CANCEL_BLOCKED')
  }
  const cfg = await loadConfig()
  const actions = actionsOf(status, req, lead, null, cfg, false)
  const flipped = await Lead.updateOne(
    { _id: lead._id, status: { $in: LEADS_FOR_TAB.upcoming.filter((s) => s !== 'in_progress') } },
    { status: 'cancelled', cancelledAt: new Date(), additionalNotes: `${lead.additionalNotes ? `${lead.additionalNotes}\n` : ''}Cancelled by customer (${CANCEL_REASONS.includes(reasonCode) ? reasonCode : 'other'})${note ? `: ${note}` : ''}` },
  )
  if (flipped.modifiedCount !== 1) {
    throw E.conflict('This booking just changed. Please refresh and try again.', 'CONFLICT')
  }
  req.cancellation = { by: 'customer', reasonCode, note, feePaise: actions.cancellationFee?.amountPaise || 0, at: new Date() }
  req.lastProjectedStatus = 'cancelled'
  req.version += 1
  await req.save()
  await RequestEvent.create(event(req._id, 'cancelled', { type: 'customer', id: String(customerId) }, status, 'cancelled', { reasonCode }))
  return getBooking(customerId, bookingId)
}

export async function rescheduleBooking(customerId, bookingId, slotId) {
  const { req, lead } = await load(customerId, bookingId)
  const status = statusOf(lead)
  if (!['submitted', 'matching', 'confirmed', 'scheduled'].includes(status)) {
    throw E.forbidden('This booking can no longer be rescheduled.', 'RESCHEDULE_BLOCKED')
  }
  const slot = await resolveSlot(slotId, { cityName: req.addressSnapshot?.city })
  const from = req.slot
  await Lead.updateOne({ _id: lead._id }, { slot: { start: new Date(slot.start), end: new Date(slot.end) }, preferredDate: new Date(slot.start), preferredTime: slot.label, additionalNotes: `${lead.additionalNotes ? `${lead.additionalNotes}\n` : ''}Customer rescheduled to ${slot.label} on ${slot.start}` })
  req.slot = { id: slot.id, start: new Date(slot.start), end: new Date(slot.end), label: slot.label }
  req.version += 1
  await req.save()
  await RequestEvent.create(event(req._id, 'rescheduled', { type: 'customer', id: String(customerId) }, from?.id, slot.id, {}))
  return getBooking(customerId, bookingId)
}

export async function acknowledgePayment(customerId, bookingId) {
  const { req, lead } = await load(customerId, bookingId)
  const cfg = await loadConfig()
  if (paymentOf(req, lead, cfg).status !== 'collected') {
    throw E.conflict('There is no payment to confirm for this booking yet.', 'PAYMENT_NOT_COLLECTED')
  }
  req.payment.status = 'confirmed'
  req.payment.confirmedAt = new Date()
  req.payment.finalAmountPaise = lead.finalAmountPaise ?? (lead.actualServiceCost ? Math.round(lead.actualServiceCost * 100) : undefined)
  req.version += 1
  await req.save()
  await RequestEvent.create(event(req._id, 'payment_confirmed', { type: 'customer', id: String(customerId) }, 'collected', 'confirmed', {}))
  return getBooking(customerId, bookingId)
}

export const loadOwned = load
export const statusLabel = (s) => LABELS[s]

/** FR-TRACK-05: the 4-digit code the Xpert must enter to start / finish the job. */
export async function getJobOtp(customerId, bookingId) {
  const { req, lead } = await load(customerId, bookingId)
  const status = statusOf(lead)
  if (!['confirmed', 'scheduled', 'in_progress'].includes(status)) {
    throw E.forbidden('The job code is available once an Xpert is assigned and until the job is finished.', 'JOB_OTP_UNAVAILABLE')
  }
  return currentJobOtp(String(req._id), status === 'in_progress' ? 'finish' : 'start')
}

/** FR-TRACK-06 / BR-04: approve or decline the vendor's final price when it is above the estimate by more than the tolerance. */
export async function respondToQuote(customerId, bookingId, quoteId, { decision, note }) {
  const { req, lead } = await load(customerId, bookingId)
  const quote = await Quote.findOne({ _id: oid(quoteId, 'quote'), requestId: req._id })
  if (!quote) throw E.notFound('We could not find that price request.')
  if (quote.status !== 'pending') throw E.conflict('This price request has already been answered.', 'QUOTE_ALREADY_ANSWERED')
  if (quote.expiresAt && quote.expiresAt < new Date()) {
    quote.status = 'expired'
    await quote.save()
    throw E.conflict('This price request has expired. Our team will contact you.', 'QUOTE_EXPIRED')
  }
  quote.status = decision === 'approve' ? 'approved' : 'declined'
  quote.respondedAt = new Date()
  quote.customerNote = note
  await quote.save()
  if (decision === 'approve') {
    const set = { quotePending: false }
    if (quote.collectOnApproval) {
      set.appPaymentStatus = 'collected'
      set.paymentStatus = 'paid'
      set.paymentCollectedAt = new Date()
      if (quote.paymentMethod) set.paymentMethod = quote.paymentMethod
    }
    await Lead.updateOne({ _id: lead._id }, { $set: set })
  } else {
    await Lead.updateOne({ _id: lead._id }, { $set: { quotePending: false, appPaymentStatus: 'disputed' } })
    req.payment.status = 'disputed'
    req.version += 1
    await req.save()
    await createTicket(
      customerId,
      { topicId: 'payment', bookingId, description: `I do not accept the final price of ${money(quote.finalPaise).display} (estimate ${quote.estimatePaise != null ? money(quote.estimatePaise).display : 'n/a'}).${note ? ` ${note}` : ''}` },
      { priority: 'high', topicName: 'Final price dispute' },
    )
  }
  await RequestEvent.create(event(req._id, decision === 'approve' ? 'quote_approved' : 'quote_declined', { type: 'customer', id: String(customerId) }, 'pending', quote.status, { finalPaise: quote.finalPaise }))
  return getBooking(customerId, bookingId)
}
