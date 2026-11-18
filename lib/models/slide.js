import mongoose from 'mongoose';

const { Schema } = mongoose;

const slideSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: String,
    imageUrl: { type: String, required: true },
    ctaText: String,
    navigationType: {
      type: String,
      enum: ['service', 'category', 'screen', 'external_url'],
      default: 'category',
    },
    navigationTarget: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Slide || mongoose.model('Slide', slideSchema);
