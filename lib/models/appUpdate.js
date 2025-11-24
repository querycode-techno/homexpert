import mongoose from 'mongoose';

const { Schema } = mongoose;

const appUpdateSchema = new Schema({
  // Version Information
  version: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  versionCode: {
    type: Number,
    required: true,
    unique: true
  },
  
  // Update Status
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  
  // Release Information
  releaseDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Admin Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
appUpdateSchema.index({ versionCode: -1 }); // Descending for latest first
appUpdateSchema.index({ isActive: 1 });
appUpdateSchema.index({ releaseDate: -1 });

export default mongoose.models.AppUpdate || mongoose.model('AppUpdate', appUpdateSchema);

