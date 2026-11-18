import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    subServiceId: String,
    subServiceName: String,
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0 },
    priceSnapshot: { type: Number, default: 0 },
    imageUrl: String,
    options: Schema.Types.Mixed,
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [cartItemSchema],
    status: {
      type: String,
      enum: ['active', 'abandoned', 'converted', 'expired'],
      default: 'active',
      index: true,
    },
    subtotal: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    abandonedAt: Date,
    convertedAt: Date,
    sessionId: String,
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Cart || mongoose.model('Cart', cartSchema);
