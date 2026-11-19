import { Promo, PromoRedemption } from '@/lib/models/booking'
import { E } from '@/lib/platform/errors'
import { money } from '@/lib/platform/money'

const invalid = (message, code = 'PROMO_INVALID') => E.validation([{ field: 'code', code, message }], message)

/** Discount (paise) a promo gives on `subtotalPaise`, never more than the subtotal. */
export function discountFor(promo, subtotalPaise) {
  const raw = promo.type === 'pct' ? Math.floor(((promo.pct || 0) * subtotalPaise) / 100 + 0.5) : promo.valuePaise || 0
  const capped = promo.maxDiscountPaise ? Math.min(raw, promo.maxDiscountPaise) : raw
  return Math.max(0, Math.min(capped, subtotalPaise))
}

/**
 * Validate a code for this customer and cart subtotal. Every rejection carries the reason in plain words (shown verbatim).
 * Returns { promo, discountPaise }.
 */
export async function evaluate(code, { customerId, subtotalPaise, now = new Date() }) {
  const promo = await Promo.findOne({ code: String(code || '').trim().toUpperCase() })
  if (!promo || promo.status !== 'active') {
    throw invalid('This code is not valid.')
  }
  if (promo.customerId && String(promo.customerId) !== String(customerId)) {
    throw invalid('This code is not valid for your account.')
  }
  if (promo.validFrom && promo.validFrom > now) {
    throw invalid('This code is not active yet.', 'PROMO_NOT_STARTED')
  }
  if (promo.validUntil && promo.validUntil < now) {
    throw invalid('This code has expired.', 'PROMO_EXPIRED')
  }
  if (promo.totalLimit != null && promo.usedCount >= promo.totalLimit) {
    throw invalid('This offer has been fully claimed.', 'PROMO_EXHAUSTED')
  }
  if (promo.perCustomerLimit != null && (await PromoRedemption.countDocuments({ promoId: promo._id, customerId })) >= promo.perCustomerLimit) {
    throw invalid('You have already used this code.', 'PROMO_ALREADY_USED')
  }
  if (promo.minSubtotalPaise && subtotalPaise < promo.minSubtotalPaise) {
    throw invalid(`Add services worth ${money(promo.minSubtotalPaise).display} or more to use this code.`, 'PROMO_MIN_NOT_MET')
  }
  const discountPaise = discountFor(promo, subtotalPaise)
  if (discountPaise <= 0) {
    throw invalid('This code does not apply to your cart.', 'PROMO_NOT_APPLICABLE')
  }
  return { promo, discountPaise }
}

/** Offers shown in the app: public active promos, plus any private ones issued to this customer. */
export async function listOffers(customerId, now = new Date()) {
  const or = [{ customerId: null }, ...(customerId ? [{ customerId }] : [])]
  const rows = await Promo.find({ status: 'active', showInOffers: true, $or: or, $and: [{ $or: [{ validUntil: null }, { validUntil: { $gte: now } }] }, { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }] }).sort({ createdAt: -1 }).limit(20).lean()
  const out = []
  for (const p of rows) {
    if (p.totalLimit != null && p.usedCount >= p.totalLimit) continue
    if (customerId && p.perCustomerLimit != null && (await PromoRedemption.countDocuments({ promoId: p._id, customerId })) >= p.perCustomerLimit) continue
    out.push({ id: String(p._id), title: p.title || p.code, description: p.description, code: p.code, validUntil: p.validUntil || undefined })
  }
  return out
}

/** Atomically claim one use of the promo (honours the total limit under concurrency). */
export async function redeem(promo, { customerId, checkoutId, discountPaise }, session) {
  const claimed = await Promo.updateOne(
    { _id: promo._id, status: 'active', $or: [{ totalLimit: null }, { totalLimit: { $exists: false } }, { $expr: { $lt: ['$usedCount', '$totalLimit'] } }] },
    { $inc: { usedCount: 1 } },
    { session },
  )
  if (claimed.modifiedCount !== 1) {
    throw E.conflict('This offer has just been fully claimed.', 'PROMO_EXHAUSTED')
  }
  await PromoRedemption.create([{ promoId: promo._id, customerId, checkoutId, discountPaise }], { session })
}
