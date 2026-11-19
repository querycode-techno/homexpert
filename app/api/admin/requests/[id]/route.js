import { NextResponse } from 'next/server'
import { guard } from '@/lib/admin/guard'
import { audit } from '@/lib/admin/audit'
import { ServiceRequest, RequestEvent } from '@/lib/models/booking'
import Lead from '@/lib/models/lead'

const LEAD_STATUSES = Lead.schema.path('status').enumValues

export async function GET(req, { params }) {
  const { id } = await params
  const g = await guard(null, { roles: ['admin', 'helpline', 'telecaller'] })
  if (g.error) return g.error
  const request = await ServiceRequest.findById(id).lean()
  if (!request) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const [lead, events] = await Promise.all([Lead.findById(request.leadId).lean(), RequestEvent.find({ requestId: id }).sort({ at: 1 }).lean()])
  return NextResponse.json({ success: true, data: { request, lead, events } })
}

/** Override the lead status with a mandatory reason (recorded in the timeline and the audit log). Assign/re-assign stays in Lead Management. */
export async function PATCH(req, { params }) {
  const { id } = await params
  const g = await guard(null, { roles: ['admin', 'helpline'] })
  if (g.error) return g.error
  const { leadStatus, reason, note } = await req.json()
  if (leadStatus && !LEAD_STATUSES.includes(leadStatus)) return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 422 })
  if (leadStatus && !reason?.trim()) return NextResponse.json({ success: false, error: 'A reason is required to override a status.' }, { status: 422 })
  const request = await ServiceRequest.findById(id)
  if (!request) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const lead = await Lead.findById(request.leadId)
  const before = { status: lead.status }
  if (leadStatus) {
    lead.status = leadStatus
    if (leadStatus === 'cancelled') lead.cancelledAt = new Date()
    if (leadStatus === 'completed') lead.completedAt = new Date()
  }
  if (note?.trim()) lead.notes.push({ note: note.trim(), createdBy: g.session.user.id, date: new Date() })
  await lead.save()
  await RequestEvent.create({ requestId: request._id, type: 'status_override', from: before.status, to: lead.status, actor: { type: 'staff', id: String(g.session.user.id || '') }, meta: { reason } })
  await audit(g.session, { action: 'status_override', entity: 'requests', entityId: id, before, after: { status: lead.status }, reason })
  return NextResponse.json({ success: true })
}
