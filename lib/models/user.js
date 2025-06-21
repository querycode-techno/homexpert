import mongoose from 'mongoose';

const { Schema } = mongoose;

// Simple User schema
const userSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Employee ID (for admin and subadmin)
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Role reference
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  
  // Profile fields
  profileImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ employeeId: 1 });

// Instance methods
userSchema.methods.generateEmployeeId = function() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `EMP${timestamp}${random}`;
};

// Static methods
userSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId }).populate('role');
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Generate employee ID if not present
  if (this.isNew && !this.employeeId) {
    this.employeeId = this.generateEmployeeId();
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);