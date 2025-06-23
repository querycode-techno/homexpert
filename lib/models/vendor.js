// vendor.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Vendor schema - extends User with vendor-specific fields
const vendorSchema = new Schema({
  // Reference to User
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Business Information
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  services: [{
    type: String,
    required: true
  }],
  
  // Documents
  documents: {
    aadharCard: {
      number: String,
      imageUrl: String,
      verified: { type: Boolean, default: false }
    },
    panCard: {
      number: String,
      imageUrl: String,
      verified: { type: Boolean, default: false }
    },
    businessLicense: {
      number: String,
      imageUrl: String,
      verified: { type: Boolean, default: false }
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      verified: { type: Boolean, default: false }
    }
  },
  
  // Detailed Address
  address: {
    street: { type: String, required: true },
    area: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    serviceAreas: [{
      city: String,
      areas: [String]
    }]
  },
  
  // Verification
  verified: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String
  },
  
  // Status & Rating
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalJobs: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // History
  history: [{
    action: {
      type: String,
      enum: ['registered', 'verified', 'suspended', 'activated', 'rejected'],
      required: true
    },
    date: { type: Date, default: Date.now },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    notes: String
  }]
  
}, {
  timestamps: true
});

// Indexes
vendorSchema.index({ user: 1 });
vendorSchema.index({ 'address.city': 1, services: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ 'verified.isVerified': 1 });

export default mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

