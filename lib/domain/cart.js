import crypto from 'crypto'
import { Cart } from '@/lib/models/booking'
import { Service, Category } from '@/lib/models/catalogue'
import { E } from '@/lib/platform/errors'
import { money } from '@/lib/platform/money'
import { oid, priceDisplay } from './catalog'
import { loadConfig } from './config'
import { price, PAYMENT_NOTE } from './pricing'
import { evaluate as evaluatePromo } from './promo'

const lineId = () => crypto.randomBytes(6).toString('hex')

async function ensureCart(customerId) {
  return (await Cart.findOne({ customerId })) || Cart.create({ customerId, lines: [] })
}

/**
 * Resolve each cart line against the LIVE catalogue (prices are never taken from the client or the snapshot) and report
 * issues. Returns the resolved lines too so checkout can reuse the exact same resolution.
 */
export async function resolveCart(cart) {
  const services = await Service.find({ _id: { $in: cart.lines.map((l) => l.serviceId) } }).lean()
  const byId = Object.fromEntries(services.map((s) => [String(s._id), s]))
  const cats = await Category.find({ _id: { $in: services.map((s) => s.categoryId) } }).select('taxClass status').lean()
  const catById = Object.fromEntries(cats.map((c) => [String(c._id), c]))
  const issues = []
  const resolved = []
  cart.lines.forEach((l) => {
    const svc = byId[String(l.serviceId)]
    const sub = svc?.subServices.find((x) => x.key === l.subServiceKey && x.status !== 'hidden')
    if (!svc || svc.status !== 'published' || !sub || catById[String(svc.categoryId)]?.status === 'hidden') {
      issues.push({ code: 'SERVICE_UNAVAILABLE', lineId: l.lineId, message: 'This service is no longer available. Remove it to continue.', severity: 'blocking' })
      return
    }
    const unit = sub.pricing?.type === 'quote' ? null : (sub.pricing?.amountPaise ?? null)
    if (unit != null && l.priceSnapshotPaise != null && l.priceSnapshotPaise !== unit) {
      issues.push({ code: 'PRICE_CHANGED', lineId: l.lineId, message: `The price of ${svc.name} changed to ${money(unit).display}.`, severity: 'warning' })
    }
    resolved.push({ line: l, svc, sub, unitPaise: unit, taxClass: catById[String(svc.categoryId)]?.taxClass || 'gst18' })
  })
  return { resolved, issues }
}

export async function presentCart(cart) {
  const { resolved, issues } = await resolveCart(cart)
  const lines = resolved.map((r) => ({ unitPaise: r.unitPaise, quantity: r.line.quantity, taxClass: r.taxClass }))
  const subtotal = lines.reduce((s, l) => s + (l.unitPaise == null ? 0 : l.unitPaise * l.quantity), 0)
  let discountPaise = 0
  let promo = null
  if (cart.promoCode) {
    try {
      const r = await evaluatePromo(cart.promoCode, { customerId: cart.customerId, subtotalPaise: subtotal })
      discountPaise = r.discountPaise
      promo = { code: r.promo.code, message: `${r.promo.code} applied. You save ${money(r.discountPaise).display}.` }
    } catch (e) {
      // The code stopped being valid (expired, minimum no longer met…): keep it visible with the reason, but do not discount.
      promo = { code: cart.promoCode, message: e.message }
      issues.push({ code: 'PROMO_INVALID', message: e.message, severity: 'warning' })
    }
  }
  const pricing = await price(lines, { discountPaise })
  return {
    lines: resolved.map((r) => ({
      lineId: r.line.lineId,
      serviceId: String(r.svc._id),
      subServiceId: r.sub.key,
      serviceName: r.svc.name,
      subServiceName: r.sub.name,
      imageUrl: r.svc.imageUrl,
      quantity: r.line.quantity,
      unitPrice: priceDisplay(r.sub.pricing),
      lineTotal: r.unitPaise == null ? undefined : money(r.unitPaise * r.line.quantity),
    })),
    itemCount: resolved.reduce((n, r) => n + r.line.quantity, 0),
    pricing,
    promo,
    issues,
    paymentNote: PAYMENT_NOTE,
    version: cart.version,
  }
}

export async function getCart(customerId) {
  return presentCart(await ensureCart(customerId))
}

async function validateLine(serviceId, subKey) {
  const svc = await Service.findOne({ _id: oid(serviceId, 'service'), status: 'published' }).lean()
  const sub = svc?.subServices.find((x) => x.key === subKey && x.status !== 'hidden')
  if (!svc || !sub) {
    throw E.notFound('This service is no longer available.', 'SERVICE_UNAVAILABLE')
  }
  return { svc, sub }
}

export async function addItem(customerId, { serviceId, subServiceId, quantity = 1 }) {
  const { svc, sub } = await validateLine(serviceId, subServiceId)
  const cart = await ensureCart(customerId)
  const { limits } = await loadConfig()
  const existing = cart.lines.find((l) => String(l.serviceId) === String(svc._id) && l.subServiceKey === sub.key)
  if (existing) {
    existing.quantity = Math.min(20, existing.quantity + quantity)
  } else {
    if (cart.lines.length >= limits.maxCartLines) {
      throw E.conflict(`Your cart can hold up to ${limits.maxCartLines} items.`, 'CART_LIMIT_REACHED')
    }
    cart.lines.push({ lineId: lineId(), serviceId: svc._id, subServiceKey: sub.key, quantity, priceSnapshotPaise: sub.pricing?.amountPaise ?? null })
  }
  cart.lastActivityAt = new Date()
  cart.version += 1
  await cart.save()
  return presentCart(cart)
}

const findLine = (cart, id) => {
  const l = cart.lines.find((x) => x.lineId === id)
  if (!l) {
    throw E.notFound('That item is not in your cart.')
  }
  return l
}

export async function setQuantity(customerId, id, quantity) {
  const cart = await ensureCart(customerId)
  findLine(cart, id).quantity = quantity
  cart.version += 1
  cart.lastActivityAt = new Date()
  await cart.save()
  return presentCart(cart)
}

export async function removeItem(customerId, id) {
  const cart = await ensureCart(customerId)
  findLine(cart, id)
  cart.lines = cart.lines.filter((l) => l.lineId !== id)
  cart.version += 1
  await cart.save()
  return presentCart(cart)
}

export async function clearCart(customerId) {
  await Cart.updateOne({ customerId }, { lines: [], $inc: { version: 1 } })
}

/** Merge device-held lines (ids + quantity only) after login. Unavailable lines are skipped, never an error. */
export async function mergeGuestCart(customerId, items) {
  const cart = await ensureCart(customerId)
  const { limits } = await loadConfig()
  for (const it of items) {
    try {
      const { svc, sub } = await validateLine(it.serviceId, it.subServiceId)
      const existing = cart.lines.find((l) => String(l.serviceId) === String(svc._id) && l.subServiceKey === sub.key)
      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + (it.quantity || 1))
      } else if (cart.lines.length < limits.maxCartLines) {
        cart.lines.push({ lineId: lineId(), serviceId: svc._id, subServiceKey: sub.key, quantity: it.quantity || 1, priceSnapshotPaise: sub.pricing?.amountPaise ?? null })
      }
    } catch {
      /* skip lines that are no longer sellable */
    }
  }
  cart.version += 1
  cart.lastActivityAt = new Date()
  await cart.save()
  return presentCart(cart)
}

export async function applyPromoCode(customerId, code) {
  const cart = await ensureCart(customerId)
  const { resolved } = await resolveCart(cart)
  const subtotal = resolved.reduce((s, r) => s + (r.unitPaise == null ? 0 : r.unitPaise * r.line.quantity), 0)
  await evaluatePromo(code, { customerId, subtotalPaise: subtotal }) // throws a 422 with the reason when not applicable
  cart.promoCode = String(code).trim().toUpperCase()
  cart.version += 1
  await cart.save()
  return presentCart(cart)
}

export async function removePromoCode(customerId) {
  const cart = await ensureCart(customerId)
  cart.promoCode = undefined
  cart.version += 1
  await cart.save()
  return presentCart(cart)
}
