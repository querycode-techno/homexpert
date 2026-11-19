import { NextResponse } from 'next/server'
import { guard } from '@/lib/admin/guard'
import { audit } from '@/lib/admin/audit'

const pick = (body, fields) => Object.fromEntries(Object.entries(body || {}).filter(([k]) => fields.includes(k)))

export async function GET(req, { params }) {
  const { resource } = await params
  const g = await guard(resource)
  if (g.error) return g.error
  const { cfg } = g
  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get('page')) || 1)
  const limit = Math.min(100, parseInt(sp.get('limit')) || 25)
  const filter = {}
  const q = sp.get('q')
  if (q && cfg.search.length) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = cfg.search.map((f) => ({ [f]: re }))
  }
  ;(cfg.filters || []).forEach((f) => {
    if (sp.get(f)) filter[f] = sp.get(f)
  })
  const [items, total] = await Promise.all([cfg.model.find(filter).sort(cfg.sort).skip((page - 1) * limit).limit(limit).lean(), cfg.model.countDocuments(filter)])
  return NextResponse.json({ success: true, data: items, meta: { page, limit, total } })
}

export async function POST(req, { params }) {
  const { resource } = await params
  const g = await guard(resource)
  if (g.error) return g.error
  const { cfg, session } = g
  if (cfg.noCreate) return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 405 })
  try {
    const doc = await cfg.model.create(pick(await req.json(), cfg.fields))
    await audit(session, { action: 'create', entity: resource, entityId: doc._id, after: doc.toObject() })
    cfg.afterWrite?.()
    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e.code === 11000 ? 'A record with that unique value already exists.' : e.message }, { status: 422 })
  }
}
