import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { connect } from '@/lib/platform/mongo'
import { RESOURCES } from '@/lib/admin/resources'

/** Staff-role check for admin APIs: `resource` selects the registry entry; omit it to require the admin role. */
export async function guard(resource, { roles } = {}) {
  const cfg = resource ? RESOURCES[resource] : { roles: roles || ['admin'] }
  if (!cfg) {
    return { error: NextResponse.json({ success: false, error: 'Unknown resource' }, { status: 404 }) }
  }
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  const role = String(typeof session.role === 'object' ? session.role.name : session.role).toLowerCase()
  if (role !== 'admin' && !cfg.roles.includes(role)) {
    return { error: NextResponse.json({ success: false, error: 'You do not have access to this section.' }, { status: 403 }) }
  }
  await connect()
  return { cfg, session }
}

