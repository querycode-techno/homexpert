import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartEventSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'service_viewed',
        'service_clicked',
        'added_to_cart',
        'removed_from_cart',
        'cart_updated',
        'checkout_started',
        'checkout_abandoned',
        'cart_expired',
        'checkout_completed',
        'slide_impression',
        'slide_tap',
      ],
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    cartId: { type: Schema.Types.ObjectId, ref: 'Cart', index: true },
    serviceId: String,
    sessionId: String,
    payload: Schema.Types.Mixed,
    deviceInfo: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.CartEvent || mongoose.model('CartEvent', cartEventSchema);
