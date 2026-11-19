import mongoose from 'mongoose'

const { Schema } = mongoose
const reg = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)
const opts = { timestamps: true }

export const Customer = reg(
  'Customer',
  new Schema(
    {
      phone: { type: String, required: true, unique: true }, // E.164 (+91…)
      phoneHash: { type: String, required: true, index: true },
      name: { type: String, default: '', trim: true, maxlength: 80 },
      email: { type: String, lowercase: true, trim: true },
      gender: { type: String, enum: ['female', 'male', 'other', 'undisclosed'] },
      avatarMediaId: { type: Schema.Types.ObjectId },
      avatarObjectKey: { type: String },
      status: { type: String, enum: ['active', 'suspended', 'pending_deletion', 'deleted'], default: 'active', index: true },
      preferences: {
        language: { type: String, default: 'en' },
        theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
        notifications: {
          bookings: { type: Boolean, default: true },
          reminders: { type: Boolean, default: true },
          support: { type: Boolean, default: true },
          offers: { type: Boolean, default: false },
        },
      },
      defaultAddressId: { type: Schema.Types.ObjectId },
      tokenVersion: { type: Number, default: 0 },
      deletion: { requestedAt: Date, scheduledFor: Date, reason: String },
      marketing: { optedIn: { type: Boolean, default: false }, optedInAt: Date },
      version: { type: Number, default: 1 },
      lastLoginAt: Date,
      referralCode: { type: String, unique: true, sparse: true },
      referredBy: { type: Schema.Types.ObjectId },
    },
    opts,
  ),
)

export const CustomerAddress = reg(
  'CustomerAddress',
  new Schema(
    {
      customerId: { type: Schema.Types.ObjectId, required: true, index: true },
      label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
      line1: { type: String, required: true, trim: true, maxlength: 200 },
      line2: { type: String, trim: true, maxlength: 200 },
      landmark: { type: String, trim: true, maxlength: 120 },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, match: /^[1-9][0-9]{5}$/ },
      contactName: { type: String, required: true, trim: true },
      contactPhone: { type: String, required: true },
      isDefault: { type: Boolean, default: false },
      deletedAt: Date,
    },
    opts,
  ),
)

export const Device = reg(
  'Device',
  new Schema(
    {
      customerId: { type: Schema.Types.ObjectId, required: true, index: true },
      deviceId: { type: String, required: true, unique: true },
      platform: { type: String, enum: ['android', 'ios'] },
      model: String,
      osVersion: String,
      appVersion: String,
      locale: String,
      fcmToken: String,
      pushEnabled: { type: Boolean, default: false },
      lastSeenAt: Date,
    },
    opts,
  ),
)

/** Append-only consent ledger. */
export const Consent = reg(
  'Consent',
  new Schema({
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: ['terms', 'privacy', 'marketing', 'analytics'], required: true },
    version: { type: String, required: true },
    granted: { type: Boolean, required: true },
    at: { type: Date, default: Date.now },
    ip: String,
    deviceId: String,
  }),
)

export const DeletionRequest = reg(
  'DeletionRequest',
  new Schema(
    {
      customerId: { type: Schema.Types.ObjectId, required: true, index: true },
      requestedAt: { type: Date, default: Date.now },
      scheduledFor: { type: Date, required: true, index: true },
      status: { type: String, enum: ['pending', 'cancelled', 'processing', 'completed', 'blocked'], default: 'pending' },
      reason: String,
      blockReason: String,
    },
    opts,
  ),
)
