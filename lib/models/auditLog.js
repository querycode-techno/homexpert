import mongoose from 'mongoose'

const { Schema } = mongoose

/** Immutable record of every admin write to customer-platform data (FR-ADM-12). Never updated or deleted by the app. */
const auditLogSchema = new Schema({
  actor: { id: String, name: String, role: String },
  action: { type: String, required: true }, // create | update | delete | status_override | recover_cart …
  entity: { type: String, required: true },
  entityId: String,
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  reason: String,
  at: { type: Date, default: Date.now, index: true },
})
auditLogSchema.index({ entity: 1, entityId: 1, at: -1 })

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
