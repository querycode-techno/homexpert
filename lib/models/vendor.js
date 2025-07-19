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
  
  // Documents - Restructured with identity and business sections
  documents: {
    identity: {
      type: {
        type: String,
        enum: ['driving_license', 'aadhar_card', 'voter_card'],
        required: false
      },
      number: {
        type: String,
        required: false,
        trim: true
      },
      docImageUrl: {
        type: String,
        required: false
      }
    },
    business: {
      type: {
        type: String,
        enum: ['gst', 'msme', 'other'],
        required: false
      },
      number: {
        type: String,
        required: false,
        trim: true
      },
      docImageUrl: {
        type: String,
        required: false
      }
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
  
  // Verification - Single verification field for entire vendor
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

  // track for which one role user onboarded the vendor and show vendor list  based on that
  onboardedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

