import { Category, FeeRule } from '@/lib/models/catalogue'
import { money, pctOf } from '@/lib/platform/money'
import { loadConfig } from './config'

const DEFAULT_TAX = { gst18: { label: 'GST (18%)', pct: 18, inclusive: true }, gst0: { label: 'GST (0%)', pct: 0, inclusive: true } }
export const ESTIMATE_DISCLAIMER = 'This is an estimate. Your Xpert confirms the final price after inspecting the work.'
export const PAYMENT_NOTE = 'Pay after service — directly to your Xpert by cash or UPI. No advance payment.'

/**
 * Deterministic pricing (doc 08 §6). Pure given its inputs. All arithmetic in integer paise, half-up rounded once per
 * component. Order: line totals → fees → tax → total. Quote-priced lines contribute 0 and force `isEstimate`.
 *
 * `lines`: [{ unitPaise|null, quantity, taxClass }]
 */
export async function price(lines, { fees = null, taxTable = null, discountPaise = 0 } = {}) {
  const cfg = await loadConfig()
  const tax = taxTable || { ...DEFAULT_TAX, ...(cfg.tax || {}) }
  const feeRules = fees ?? (await FeeRule.find({ active: true }).lean())

  const subtotal = lines.reduce((s, l) => s + (l.unitPaise == null ? 0 : l.unitPaise * l.quantity), 0)
  const feeLines = lines.length === 0 ? [] : feeRules.map((r) => ({ code: r.code, label: r.label, paise: r.type === 'pct' ? pctOf(subtotal, r.pct || 0) : r.amountPaise || 0 })).filter((f) => f.paise > 0)
  const feeTotal = feeLines.reduce((s, f) => s + f.paise, 0)
  const discount = Math.min(Math.max(0, discountPaise), subtotal)
  const base = subtotal + feeTotal - discount

  // Tax by class on each line's share; fees are taxed at the dominant (highest-value) line's class.
  const byClass = new Map()
  lines.forEach((l) => {
    const v = l.unitPaise == null ? 0 : l.unitPaise * l.quantity
    byClass.set(l.taxClass || 'gst18', (byClass.get(l.taxClass || 'gst18') || 0) + v)
  })
  // A discount lowers the taxable value of the lines proportionally
  if (discount > 0 && subtotal > 0) {
    let left = discount
    const entries = [...byClass.entries()]
    entries.forEach(([cls, amount], i) => {
      const share = i === entries.length - 1 ? left : Math.floor((discount * amount) / subtotal)
      byClass.set(cls, Math.max(0, amount - share))
      left -= share
    })
  }
  if (feeTotal > 0 && byClass.size > 0) {
    const dominant = [...byClass.entries()].sort((a, b) => b[1] - a[1])[0][0]
    byClass.set(dominant, byClass.get(dominant) + feeTotal)
  }
  let taxPaise = 0
  let exclusive = 0
  let label = 'Tax'
  let inclusive = true
  byClass.forEach((amount, cls) => {
    const t = tax[cls] || tax.gst18
    label = t.label
    inclusive = t.inclusive
    if (t.inclusive) {
      taxPaise += Math.floor((amount * t.pct) / (100 + t.pct) + 0.5)
    } else {
      const add = pctOf(amount, t.pct)
      taxPaise += add
      exclusive += add
    }
  })
  const total = base + exclusive
  const hasQuote = lines.some((l) => l.unitPaise == null)
  return {
    subtotal: money(subtotal),
    ...(discount > 0 ? { discount: money(discount), savings: money(discount) } : {}),
    fees: feeLines.map((f) => ({ code: f.code, label: f.label, amount: money(f.paise) })),
    tax: { label, inclusive, pct: (tax[[...byClass.keys()][0]] || tax.gst18).pct, amount: money(taxPaise) },
    total: money(total),
    isEstimate: true,
    disclaimer: hasQuote ? 'Some items are priced after inspection. ' + ESTIMATE_DISCLAIMER : ESTIMATE_DISCLAIMER,
  }
}

export async function taxClassFor(categoryId) {
  const c = await Category.findById(categoryId).select('taxClass').lean()
  return c?.taxClass || 'gst18'
}
