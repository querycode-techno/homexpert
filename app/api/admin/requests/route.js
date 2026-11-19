import { NextResponse } from 'next/server'
import { guard } from '@/lib/admin/guard'
import { ServiceRequest } from '@/lib/models/booking'

/** FR-ADM-05 bookings console: customer requests joined with their lead (status the vendors see), customer and assigned vendor. */
export async function GET(req) {
  const g = await guard(null, { roles: ['admin', 'helpline', 'telecaller'] })
  if (g.error) return g.error
  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get('page')) || 1)
  const limit = Math.min(100, parseInt(sp.get('limit')) || 25)
  const q = sp.get('q')
  const match = {}
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    match.$or = [{ displayId: re }, { 'service.name': re }, { 'addressSnapshot.contactName': re }, { 'addressSnapshot.contactPhone': re }]
  }
  const pipeline = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'leads', localField: 'leadId', foreignField: '_id', as: 'lead' } },
    { $unwind: '$lead' },
    ...(sp.get('leadStatus') ? [{ $match: { 'lead.status': sp.get('leadStatus') } }] : []),
    { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
    { $lookup: { from: 'users', localField: 'lead.takenBy', foreignField: '_id', as: 'vendor' } },
    {
      $project: {
        displayId: 1, checkoutId: 1, createdAt: 1, slot: 1, urgency: 1, 'service.name': 1, 'pricing.total': 1, payment: 1,
        leadId: '$lead._id', leadStatus: '$lead.status', leadCreatedAt: '$lead.createdAt', takenAt: '$lead.takenAt', quotePending: '$lead.quotePending',
        customer: { $let: { vars: { c: { $arrayElemAt: ['$customer', 0] } }, in: { id: '$$c._id', name: '$$c.name', phone: '$$c.phone' } } },
        vendor: { $let: { vars: { v: { $arrayElemAt: ['$vendor', 0] } }, in: { id: '$$v._id', name: '$$v.name', phone: '$$v.phone' } } },
      },
    },
    { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: 'n' }] } },
  ]
  const [r] = await ServiceRequest.aggregate(pipeline)
  return NextResponse.json({ success: true, data: r.items, meta: { page, limit, total: r.total[0]?.n || 0 } })
}
