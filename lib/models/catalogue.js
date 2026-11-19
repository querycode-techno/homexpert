import mongoose from 'mongoose'

const { Schema } = mongoose
const reg = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)
const opts = { timestamps: true }

export const City = reg('ServiceCity', new Schema({ name: { type: String, required: true }, state: String, isActive: { type: Boolean, default: true }, launchedAt: Date }, opts))

export const Category = reg(
  'Category',
  new Schema(
    {
      slug: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      iconUrl: String,
      imageUrl: String,
      sortOrder: { type: Number, default: 0 },
      status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'published', index: true },
      taxClass: { type: String, default: 'gst18' },
      cityIds: [{ type: Schema.Types.ObjectId }],
    },
    opts,
  ),
)

const subService = new Schema(
  {
    key: { type: String, required: true }, // stable id within the service
    name: { type: String, required: true },
    note: String,
    pricing: { type: { type: String, enum: ['fixed', 'from', 'quote'], default: 'fixed' }, amountPaise: Number },
    durationMinutes: { type: Number, default: 60 },
    status: { type: String, enum: ['active', 'hidden'], default: 'active' },
  },
  { _id: false },
)

export const Service = reg(
  'Service',
  (() => {
    const s = new Schema(
      {
        categoryId: { type: Schema.Types.ObjectId, required: true, index: true },
        slug: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        shortDescription: String,
        description: String,
        imageUrl: String,
        gallery: [String],
        inclusions: [String],
        exclusions: [String],
        howItWorks: [String],
        warranty: String,
        faqs: [{ question: String, answer: String }],
        subServices: [subService],
        taxClass: String,
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        popularityScore: { type: Number, default: 0 },
        badges: [String],
        status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'published', index: true },
        catalogVersion: { type: Number, default: 1 },
      },
      opts,
    )
    return s
  })(),
)

export const ServiceArea = reg(
  'ServiceArea',
  (() => {
    const s = new Schema(
      {
        cityId: { type: Schema.Types.ObjectId, required: true },
        pincode: { type: String, required: true, unique: true },
        categoryIds: [{ type: Schema.Types.ObjectId }],
        status: { type: String, enum: ['live', 'waitlist', 'closed'], default: 'live' },
      },
      opts,
    )
    return s
  })(),
)

export const SlotTemplate = reg(
  'SlotTemplate',
  new Schema(
    {
      cityId: { type: Schema.Types.ObjectId },
      windows: [{ start: String, end: String, label: String }], // "09:00"-"11:00" local IST
      leadTimeMinutes: { type: Number, default: 120 },
      maxPerWindow: { type: Number, default: 20 },
      daysAhead: { type: Number, default: 14 },
      holidays: [String], // YYYY-MM-DD
      urgentSurchargeNote: String,
    },
    opts,
  ),
)

export const Waitlist = reg(
  'Waitlist',
  new Schema({ phoneHash: { type: String, required: true }, pincode: { type: String, required: true }, notifiedAt: Date }, opts),
)

/** Finance-owned configuration. */
export const FeeRule = reg(
  'FeeRule',
  new Schema({ code: { type: String, required: true, unique: true }, label: String, type: { type: String, enum: ['flat', 'pct'], default: 'flat' }, amountPaise: Number, pct: Number, active: { type: Boolean, default: true } }, opts),
)
