import { NextResponse } from 'next/server'
import { guard } from '@/lib/admin/guard'
import { AppEvent, Cart } from '@/lib/models/booking'

const STEPS = ['service_view', 'add_to_cart', 'cart_view', 'checkout_start', 'checkout_submit', 'booking_confirmed']

/** FR-ADM-06 funnel: distinct sessions reaching each step over the last N days, plus cart counts by status. */
export async function GET(req) {
  const g = await guard('carts')
  if (g.error) return g.error
  const days = Math.min(90, parseInt(new URL(req.url).searchParams.get('days')) || 7)
  const since = new Date(Date.now() - days * 86400_000)
  const rows = await AppEvent.aggregate([{ $match: { ts: { $gte: since }, name: { $in: STEPS } } }, { $group: { _id: { name: '$name', s: '$sessionId' } } }, { $group: { _id: '$_id.name', sessions: { $sum: 1 } } }])
  const by = Object.fromEntries(rows.map((r) => [r._id, r.sessions]))
  const carts = await Cart.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])
  return NextResponse.json({ success: true, data: { days, steps: STEPS.map((s) => ({ step: s, sessions: by[s] || 0 })), carts: Object.fromEntries(carts.map((c) => [c._id, c.n])) } })
}
