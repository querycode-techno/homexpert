import mongoose from 'mongoose'

const { Schema } = mongoose
const reg = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)
const opts = { timestamps: true }

export const Cart = reg(
  'CustomerCart',
  new Schema(
    {
      customerId: { type: Schema.Types.ObjectId, required: true, unique: true },
      lines: [
        {
          lineId: { type: String, required: true },
          serviceId: { type: Schema.Types.ObjectId, required: true },
          subServiceKey: { type: String, required: true },
          quantity: { type: Number, default: 1, min: 1, max: 20 },
          priceSnapshotPaise: Number,
          addedAt: { type: Date, default: Date.now },
        },
      ],
      promoCode: { type: String },
      status: { type: String, enum: ['active', 'converted', 'expired'], default: 'active' },
      lastActivityAt: { type: Date, default: Date.now },
      version: { type: Number, default: 1 },
    },
    opts,
  ),
)

export const ServiceRequest = reg(
  'ServiceRequest',
  (() => {
    const s = new Schema(
      {
        displayId: { type: String, required: true, unique: true },
        checkoutId: { type: String, required: true, index: true },
        customerId: { type: Schema.Types.ObjectId, required: true, index: true },
        leadId: { type: Schema.Types.ObjectId, required: true, unique: true },
        service: { id: Schema.Types.ObjectId, name: String, categoryId: Schema.Types.ObjectId, imageUrl: String },
        lines: [{ lineId: String, subServiceKey: String, name: String, quantity: Number, unitPaise: Number, lineTotalPaise: Number }],
        addressSnapshot: Schema.Types.Mixed,
        addressId: Schema.Types.ObjectId,
        slot: { id: String, start: Date, end: Date, label: String },
        notes: String,
        urgency: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
        mediaIds: [Schema.Types.ObjectId],
        pricing: Schema.Types.Mixed, // snapshot of the server-computed Pricing at booking time
        payment: {
          mode: { type: String, default: 'pay_after_service' },
          status: { type: String, enum: ['pending', 'collected', 'confirmed', 'disputed', 'waived'], default: 'pending' },
          finalAmountPaise: Number,
          collectedAt: Date,
          confirmedAt: Date,
        },
        promo: { code: String, discountPaise: Number },
        cancellation: { by: String, reasonCode: String, note: String, feePaise: Number, at: Date },
        lastProjectedStatus: String, // used by the sync job to detect vendor-side changes
        reviewId: Schema.Types.ObjectId,
        issueTicketIds: [Schema.Types.ObjectId],
        version: { type: Number, default: 1 },
      },
      opts,
    )
    s.index({ customerId: 1, createdAt: -1 })
    return s
  })(),
)

/** Append-only timeline + audit. */
export const RequestEvent = reg(
  'RequestEvent',
  new Schema({
    requestId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    from: String,
    to: String,
    actor: { type: { type: String }, id: String },
    meta: Schema.Types.Mixed,
    at: { type: Date, default: Date.now },
  }),
)

export const Review = reg(
  'Review',
  new Schema(
    {
      requestId: { type: Schema.Types.ObjectId, required: true, unique: true },
      customerId: { type: Schema.Types.ObjectId, required: true },
      serviceId: { type: Schema.Types.ObjectId, required: true, index: true },
      vendorId: Schema.Types.ObjectId,
      rating: { type: Number, min: 1, max: 5, required: true },
      tags: [String],
      text: { type: String, maxlength: 500 },
      mediaIds: [Schema.Types.ObjectId],
      helpfulCount: { type: Number, default: 0 },
      authorName: String,
      status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'published' },
    },
    opts,
  ),
)

export const CustomerNotification = reg(
  'CustomerNotification',
  (() => {
    const s = new Schema(
      {
        customerId: { type: Schema.Types.ObjectId, required: true, index: true },
        category: { type: String, enum: ['bookings', 'reminders', 'support', 'offers'], required: true },
        title: String,
        body: String,
        deepLink: String,
        dedupeKey: { type: String, required: true },
        readAt: Date,
      },
      opts,
    )
    s.index({ customerId: 1, dedupeKey: 1 }, { unique: true })
    s.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 })
    return s
  })(),
)

/** Client analytics + cart-funnel events (allow-listed props, no PII). */
export const AppEvent = reg(
  'AppEvent',
  (() => {
    const s = new Schema({
      customerId: { type: Schema.Types.ObjectId, index: true },
      sessionId: String,
      deviceId: String,
      appVersion: String,
      name: { type: String, index: true },
      props: Schema.Types.Mixed,
      ts: Date,
    })
    s.index({ ts: 1 }, { expireAfterSeconds: 180 * 86400 })
    return s
  })(),
)

/** Promo codes (FR-CART-06 / FR-ADM-08). `customerId` restricts a code to one customer (referral rewards). */
export const Promo = reg(
  'Promo',
  new Schema(
    {
      code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 24 },
      title: String,
      description: String,
      type: { type: String, enum: ['flat', 'pct'], default: 'flat' },
      valuePaise: Number,
      pct: Number,
      maxDiscountPaise: Number,
      minSubtotalPaise: { type: Number, default: 0 },
      validFrom: Date,
      validUntil: Date,
      totalLimit: Number,
      perCustomerLimit: { type: Number, default: 1 },
      usedCount: { type: Number, default: 0 },
      customerId: { type: Schema.Types.ObjectId, index: true },
      showInOffers: { type: Boolean, default: true },
      status: { type: String, enum: ['active', 'paused'], default: 'active' },
    },
    opts,
  ),
)

export const PromoRedemption = reg(
  'PromoRedemption',
  (() => {
    const s = new Schema({ promoId: { type: Schema.Types.ObjectId, required: true, index: true }, customerId: { type: Schema.Types.ObjectId, required: true }, checkoutId: { type: String, required: true }, discountPaise: Number, at: { type: Date, default: Date.now } })
    s.index({ promoId: 1, checkoutId: 1 }, { unique: true })
    return s
  })(),
)

/** Final-price approval request (BR-04) raised when a vendor's final amount exceeds the estimate by more than the tolerance. */
export const Quote = reg(
  'Quote',
  new Schema(
    {
      requestId: { type: Schema.Types.ObjectId, required: true, index: true },
      leadId: { type: Schema.Types.ObjectId, required: true },
      estimatePaise: Number,
      finalPaise: { type: Number, required: true },
      note: String,
      paymentMethod: String,
      collectOnApproval: { type: Boolean, default: false },
      status: { type: String, enum: ['pending', 'approved', 'declined', 'expired'], default: 'pending', index: true },
      expiresAt: Date,
      respondedAt: Date,
      customerNote: String,
    },
    opts,
  ),
)

export const Referral = reg(
  'Referral',
  new Schema({ referrerId: { type: Schema.Types.ObjectId, required: true, index: true }, refereeId: { type: Schema.Types.ObjectId, required: true, unique: true }, status: { type: String, enum: ['pending', 'rewarded'], default: 'pending' }, rewardedAt: Date }, opts),
)

export const ReviewVote = reg(
  'ReviewVote',
  (() => {
    const s = new Schema({ reviewId: { type: Schema.Types.ObjectId, required: true }, customerId: { type: Schema.Types.ObjectId, required: true } })
    s.index({ reviewId: 1, customerId: 1 }, { unique: true })
    return s
  })(),
)
