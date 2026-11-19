import AuditLog from '@/lib/models/auditLog'

export async function audit(session, { action, entity, entityId, before, after, reason }) {
  const u = session.user || {}
  await AuditLog.create({
    actor: { id: String(u.id || u.userId || ''), name: u.name, role: typeof session.role === 'object' ? session.role.name : session.role },
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    before,
    after,
    reason,
  })
}
