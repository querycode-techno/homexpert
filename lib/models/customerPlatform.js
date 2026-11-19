import mongoose from 'mongoose'

const { Schema } = mongoose
const reg = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)

export const OtpRequest = reg(
  'OtpRequest',
  (() => {
    const s = new Schema(
      {
        phoneHash: { type: String, required: true, index: true },
        phone: { type: String, required: true },
        codeHmac: { type: String, required: true },
        deviceId: { type: String, required: true },
        ip: String,
        attempts: { type: Number, default: 0 },
        maxAttempts: { type: Number, default: 5 },
        expiresAt: { type: Date, required: true },
        consumedAt: Date,
        purpose: { type: String, default: 'login' },
      },
      { timestamps: true },
    )
    s.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }) // keep a day for abuse forensics, then purge
    return s
  })(),
)

export const RefreshToken = reg(
  'RefreshToken',
  (() => {
    const s = new Schema(
      {
        customerId: { type: Schema.Types.ObjectId, required: true, index: true },
        sessionId: { type: String, required: true, index: true },
        familyId: { type: String, required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        deviceId: String,
        expiresAt: { type: Date, required: true },
        absoluteExpiresAt: { type: Date, required: true },
        rotatedAt: Date,
        revokedAt: Date,
        reuseDetectedAt: Date,
        ip: String,
        userAgent: String,
      },
      { timestamps: true },
    )
    s.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0 })
    return s
  })(),
)

/** Fixed-window counters for rate limiting (works on any host; no Redis dependency). */
export const RateCounter = reg(
  'RateCounter',
  (() => {
    const s = new Schema({ key: { type: String, required: true, unique: true }, count: { type: Number, default: 0 }, expiresAt: { type: Date, required: true } })
    s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    return s
  })(),
)

export const IdempotencyKey = reg(
  'IdempotencyKey',
  (() => {
    const s = new Schema(
      {
        customerId: { type: Schema.Types.ObjectId, required: true },
        route: { type: String, required: true },
        key: { type: String, required: true },
        requestHash: { type: String, required: true },
        status: { type: String, enum: ['in_progress', 'done'], default: 'in_progress' },
        responseStatus: Number,
        response: Schema.Types.Mixed,
        expiresAt: { type: Date, required: true },
      },
      { timestamps: true },
    )
    s.index({ customerId: 1, route: 1, key: 1 }, { unique: true })
    s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    return s
  })(),
)

/** Singleton-style config documents keyed by `key` (version policy, maintenance, support, legal, limits, cancellation policy). */
export const AppConfig = reg('AppConfig', new Schema({ key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed, updatedBy: String }, { timestamps: true }))

export const MediaUpload = reg(
  'MediaUpload',
  new Schema(
    {
      ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
      purpose: { type: String, enum: ['booking_photo', 'review_photo', 'ticket_attachment', 'avatar'], required: true },
      contentType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      objectKey: { type: String, required: true },
      status: { type: String, enum: ['issued', 'ready', 'rejected'], default: 'issued' },
      expiresAt: Date,
    },
    { timestamps: true },
  ),
)
