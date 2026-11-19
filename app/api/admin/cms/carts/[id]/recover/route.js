import { NextResponse } from 'next/server'
import { guard } from '@/lib/admin/guard'
import { audit } from '@/lib/admin/audit'
import { Cart } from '@/lib/models/booking'
import { notify } from '@/lib/domain/notifications'

/** FR-ADM-06 manual recovery: one reminder per cart per day (marketing category, so the customer's opt-in is honoured). */
export async function POST(req, { params }) {
  const { id } = await params
  const g = await guard('carts')
  if (g.error) return g.error
  const cart = await Cart.findById(id)
  if (!cart || cart.lines.length === 0) return NextResponse.json({ success: false, error: 'Cart is empty or not found' }, { status: 404 })
  const sent = await notify(cart.customerId, { category: 'offers', title: 'You left something in your cart', body: 'Your selected services are waiting. Book now and pay after the service.', deepLink: 'homesxpert://cart', dedupeKey: `cart-recovery:${cart._id}:${new Date().toISOString().slice(0, 10)}` })
  await audit(g.session, { action: 'recover_cart', entity: 'carts', entityId: id, after: { sent } })
  return NextResponse.json({ success: true, data: { sent } })
}
