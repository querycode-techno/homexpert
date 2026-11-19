import { NextResponse } from 'next/server'
import { guard } from '@/lib/admin/guard'
import { audit } from '@/lib/admin/audit'
import { extraDetail } from '@/lib/admin/resources'
import { Review } from '@/lib/models/booking'
import { Service } from '@/lib/models/catalogue'

const pick = (body, fields) => Object.fromEntries(Object.entries(body || {}).filter(([k]) => fields.includes(k)))

/** Rating aggregates are derived from published reviews, so moderation recalculates them. */
async function recomputeRating(serviceId) {
  const rows = await Review.aggregate([{ $match: { serviceId, status: 'published' } }, { $group: { _id: null, n: { $sum: 1 }, avg: { $avg: '$rating' } } }])
  await Service.updateOne({ _id: serviceId }, { ratingCount: rows[0]?.n || 0, ratingAvg: rows[0] ? Math.round(rows[0].avg * 10) / 10 : 0 })
}

export async function GET(req, { params }) {
  const { resource, id } = await params
  const g = await guard(resource)
  if (g.error) return g.error
  const doc = await g.cfg.model.findById(id).lean()
  if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const extra = extraDetail[resource] ? await extraDetail[resource](doc) : {}
  return NextResponse.json({ success: true, data: { ...doc, ...extra } })
}

export async function PATCH(req, { params }) {
  const { resource, id } = await params
  const g = await guard(resource)
  if (g.error) return g.error
  const { cfg, session } = g
  const before = await cfg.model.findById(id).lean()
  if (!before) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const update = pick(body, cfg.fields)
  if (cfg.bump) update.$inc = { [cfg.bump]: 1 }
  try {
    const { $inc, ...set } = update
    const after = await cfg.model.findByIdAndUpdate(id, { $set: set, ...($inc ? { $inc } : {}) }, { new: true, runValidators: true }).lean()
    await audit(session, { action: 'update', entity: resource, entityId: id, before, after, reason: body.reason })
    if (resource === 'reviews' && set.status) await recomputeRating(after.serviceId)
    cfg.afterWrite?.()
    return NextResponse.json({ success: true, data: after })
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 422 })
  }
}

export async function DELETE(req, { params }) {
  const { resource, id } = await params
  const g = await guard(resource)
  if (g.error) return g.error
  const { cfg, session } = g
  if (cfg.noDelete) return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 405 })
  const before = await cfg.model.findByIdAndDelete(id).lean()
  if (!before) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  await audit(session, { action: 'delete', entity: resource, entityId: id, before })
  cfg.afterWrite?.()
  return NextResponse.json({ success: true })
}
