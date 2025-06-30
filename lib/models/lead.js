import mongoose from 'mongoose';

const { Schema } = mongoose;

// Lead schema with multi-vendor availability and admin assignment control
const leadSchema = new Schema({
  // Customer Information (flattened for vendor app compatibility)
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  
  // Service Information
  service: {
    type: String,
    required: true,
    trim: true
  },
  selectedService: {
    type: String,
    required: true,
    trim: true
  },
  selectedSubService: {
    type: String,
    required: false,
    trim: true
  },
  
  
  // Location and Address
  address: {
    type: String,
    required: true,
    trim: true
  },
  
  // Lead Details
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: false
  },
  getQuote: {
    type: Boolean,
    default: false
  },
  additionalNotes: {
    type: String,
    required: false,
    trim: true
  },
  
  // Scheduling Information
  preferredDate: {
    type: Date,
    required: false
  },
  preferredTime: {
    type: String,
    required: false,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: false
  },
  scheduledTime: {
    type: String,
    required: false,
    trim: true
  },
  
  // Lead Status with complete workflow
  status: {
    type: String,
    required: true,
    enum: [
      'pending',          // Posted by customer, waiting for admin review
      'available',        // Admin made available to specific vendors
      'assigned',         // Admin assigned to specific vendor
      'unassigned',       // Admin unassigned from specific vendor
      'taken',           // One vendor has taken the lead
      'contacted',       // Vendor contacted customer
      'interested',      // Customer showed interest
      'not_interested',  // Customer not interested
      'scheduled',       // Service scheduled
      'in_progress',     // Service in progress
      'completed',       // Service completed successfully
      'cancelled',       // Service cancelled
      'converted',       // Lead converted to sale
      'expired',         // Lead expired
      'refund_requested' // Vendor requested refund
    ],
    default: 'pending'
  },
  
  // Multi-Vendor Availability System - Admin Controlled
  availableToVendors: {
    vendor: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }],
    assignedAt: {
      type: Date,
      required: false
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Admin who assigned
      required: false
    },
  },
  
  // Single Vendor Assignment after taking
  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Vendor who took the lead first
    required: false
  },
  
  // Status Timestamps
  takenAt: {
    type: Date,
    required: false
  },
  madeAvailableAt: {
    type: Date,
    required: false
  },
  contactedAt: {
    type: Date,
    required: false
  },
  interestedAt: {
    type: Date,
    required: false
  },
  notInterestedAt: {
    type: Date,
    required: false
  },
  scheduledAt: {
    type: Date,
    required: false
  },
  convertedAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  cancelledAt: {
    type: Date,
    required: false
  },
  
  // Lead Conversion and Value
  conversionValue: {
    type: Number,
    min: 0,
    required: false
  },
  actualServiceCost: {
    type: Number,
    min: 0,
    required: false
  },
  
  // Follow-ups History
  followUps: [{
    followUp: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Notes History
  notes: [{
    note: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  
  // Lead Progress History
  leadProgressHistory: [{
    fromStatus: {
      type: String,
      required: false
    },
    toStatus: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  }],
  
  // Lead Refund Request System
  refundRequest: {
    isRequested: {
      type: Boolean,
      default: false
    },
    requestedAt: {
      type: Date,
      required: false
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    reason: {
      type: String,
      enum: [
        'customer_not_responding',
        'customer_cancelled',
        'incorrect_requirements',
        'location_inaccessible',
        'pricing_mismatch',
        'technical_issues',
        'duplicate_lead',
        'other'
      ],
      required: false
    },
    reasonDetails: {
      type: String,
      trim: true,
      required: false
    },
    adminResponse: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'under_review'],
        default: 'pending'
      },
      responseNote: {
        type: String,
        trim: true
      },
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      respondedAt: {
        type: Date
      },
      refundAmount: {
        type: Number,
        min: 0
      }
    }
  },
  
  // Admin Tracking
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes optimized for new vendor assignment system
leadSchema.index({ customerPhone: 1 });
leadSchema.index({ customerEmail: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ service: 1 });
leadSchema.index({ address: 1 });
leadSchema.index({ 'availableToVendors.vendor': 1 });
leadSchema.index({ takenBy: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ 'refundRequest.isRequested': 1 });

// Compound indexes for new schema
leadSchema.index({ service: 1, address: 1 });
leadSchema.index({ status: 1, 'availableToVendors.vendor': 1 });
leadSchema.index({ 'availableToVendors.vendor': 1, status: 1 });
leadSchema.index({ takenBy: 1, status: 1 });
leadSchema.index({ 'availableToVendors.assignedBy': 1, createdAt: -1 });

// Text index for search
leadSchema.index({
  customerName: 'text',
  description: 'text',
  service: 'text',
  selectedService: 'text',
  address: 'text'
});

// Virtual fields updated for new schema
leadSchema.virtual('isAvailableToVendors').get(function() {
  return this.availableToVendors?.vendor?.length > 0;
});

leadSchema.virtual('isTaken').get(function() {
  return this.takenBy !== null && this.takenBy !== undefined;
});

leadSchema.virtual('isConverted').get(function() {
  return this.status === 'converted';
});

leadSchema.virtual('isCompleted').get(function() {
  return ['completed', 'converted'].includes(this.status);
});

leadSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

leadSchema.virtual('isAvailable').get(function() {
  return ['available', 'assigned'].includes(this.status);
});

leadSchema.virtual('canTake').get(function() {
  return this.isAvailable && !this.isTaken;
});

leadSchema.virtual('vendorCount').get(function() {
  return this.availableToVendors?.vendor?.length || 0;
});

leadSchema.virtual('hasMultipleVendors').get(function() {
  return this.vendorCount > 1;
});

leadSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

leadSchema.virtual('daysSinceAvailable').get(function() {
  if (!this.madeAvailableAt) return null;
  return Math.floor((Date.now() - this.madeAvailableAt) / (1000 * 60 * 60 * 24));
});

leadSchema.virtual('daysSinceTaken').get(function() {
  if (!this.takenAt) return null;
  return Math.floor((Date.now() - this.takenAt) / (1000 * 60 * 60 * 24));
});

leadSchema.virtual('canRefund').get(function() {
  return this.takenBy && !this.isCompleted && !this.refundRequest.isRequested;
});

// Instance methods updated for new schema
leadSchema.methods.makeAvailableToVendors = function(vendorIds, adminId) {
  this.availableToVendors = {
    vendor: vendorIds,
    assignedAt: new Date(),
    assignedBy: adminId
  };
  this.status = 'available';
  this.madeAvailableAt = new Date();
  
  // Add to progress history
  this.leadProgressHistory.push({
    fromStatus: 'pending',
    toStatus: 'available',
    performedBy: adminId,
    reason: `Lead made available to ${vendorIds.length} vendors`
  });
  
  return this.save();
};

leadSchema.methods.assignToSingleVendor = function(vendorId, adminId) {
  this.availableToVendors = {
    vendor: [vendorId],
    assignedAt: new Date(),
    assignedBy: adminId
  };
  this.status = 'assigned';
  this.madeAvailableAt = new Date();
  
  // Add to progress history
  this.leadProgressHistory.push({
    fromStatus: this.status,
    toStatus: 'assigned',
    performedBy: adminId,
    reason: 'Lead assigned to specific vendor'
  });
  
  return this.save();
};

leadSchema.methods.takeByVendor = function(vendorId) {
  // Check if vendor is in the available vendors list
  if (!this.availableToVendors?.vendor?.includes(vendorId)) {
    throw new Error('Lead is not available to this vendor');
  }
  
  this.takenBy = vendorId;
  this.takenAt = new Date();
  this.status = 'taken';
  
  // Add to progress history
  this.leadProgressHistory.push({
    fromStatus: this.status,
    toStatus: 'taken',
    performedBy: vendorId,
    reason: 'Lead taken by vendor'
  });
  
  return this.save();
};

leadSchema.methods.unassignFromVendors = function(adminId) {
  this.availableToVendors = {
    vendor: [],
    assignedAt: null,
    assignedBy: null
  };
  this.status = 'unassigned';
  this.takenBy = null;
  this.takenAt = null;
  
  // Add to progress history
  this.leadProgressHistory.push({
    fromStatus: this.status,
    toStatus: 'unassigned',
    performedBy: adminId,
    reason: 'Lead unassigned from all vendors'
  });
  
  return this.save();
};

leadSchema.methods.updateStatus = function(newStatus, userId = null, reason = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Set appropriate timestamps
  const now = new Date();
  switch(newStatus) {
    case 'contacted':
      this.contactedAt = now;
      break;
    case 'interested':
      this.interestedAt = now;
      break;
    case 'not_interested':
      this.notInterestedAt = now;
      break;
    case 'scheduled':
      this.scheduledAt = now;
      break;
    case 'converted':
      this.convertedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      break;
  }
  
  if (userId) {
    this.modifiedBy = userId;
  }
  
  // Add to progress history
  this.leadProgressHistory.push({
    fromStatus: oldStatus,
    toStatus: newStatus,
    performedBy: userId,
    reason: reason || `Status updated to ${newStatus}`
  });
  
  return this.save();
};

leadSchema.methods.addFollowUp = function(followUpText, userId) {
  this.followUps.push({
    followUp: followUpText,
    createdBy: userId,
    date: new Date()
  });
  return this.save();
};

leadSchema.methods.addNote = function(noteText, userId) {
  this.notes.push({
    note: noteText,
    createdBy: userId,
    date: new Date()
  });
  return this.save();
};

leadSchema.methods.requestRefund = function(refundData, userId) {
  this.refundRequest = {
    isRequested: true,
    requestedAt: new Date(),
    requestedBy: userId,
    ...refundData,
    adminResponse: {
      status: 'pending'
    }
  };
  this.status = 'refund_requested';
  this.modifiedBy = userId;
  return this.save();
};

leadSchema.methods.processRefund = function(adminResponse, adminUserId) {
  this.refundRequest.adminResponse = {
    ...adminResponse,
    respondedBy: adminUserId,
    respondedAt: new Date()
  };
  
  if (adminResponse.status === 'approved') {
    this.status = 'pending'; // Make lead pending again if refund approved
  } else if (adminResponse.status === 'rejected') {
    this.status = 'taken'; // Revert to taken status if rejected
  }
  
  this.modifiedBy = adminUserId;
  return this.save();
};

// Static methods updated for new schema
leadSchema.statics.findPendingForAdmin = function() {
  return this.find({ status: 'pending' });
};

leadSchema.statics.findAvailableToVendor = function(vendorId) {
  return this.find({ 
    'availableToVendors.vendor': vendorId,
    status: { $in: ['available', 'assigned'] },
    takenBy: { $exists: false }
  }).populate('availableToVendors.assignedBy');
};

leadSchema.statics.findTakenByVendor = function(vendorId) {
  return this.find({ takenBy: vendorId }).populate('takenBy');
};

leadSchema.statics.findByVendor = function(vendorId) {
  // Return all leads available to this vendor (taken or not taken)
  return this.find({ 
    'availableToVendors.vendor': vendorId 
  }).populate('takenBy availableToVendors.assignedBy');
};

leadSchema.statics.findByService = function(service) {
  return this.find({ service });
};

leadSchema.statics.findByAddress = function(address) {
  return this.find({ address: new RegExp(address, 'i') });
};

leadSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

leadSchema.statics.findRefundRequests = function() {
  return this.find({ 'refundRequest.isRequested': true });
};

leadSchema.statics.findUnassignedLeads = function() {
  return this.find({ 
    status: 'pending',
    $or: [
      { 'availableToVendors.vendor': { $size: 0 } },
      { 'availableToVendors.vendor': { $exists: false } }
    ]
  });
};

leadSchema.statics.findMultiVendorLeads = function() {
  return this.find({
    status: 'available',
    $expr: { $gt: [{ $size: '$availableToVendors.vendor' }, 1] }
  });
};

leadSchema.statics.getAdminLeadStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$conversionValue' }
      }
    }
  ]);
};

leadSchema.statics.getVendorStats = function(vendorId) {
  return this.aggregate([
    { 
      $match: { 
        'availableToVendors.vendor': vendorId 
      } 
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$conversionValue' }
      }
    }
  ]);
};

leadSchema.statics.getVendorLeadCounts = function(vendorId) {
  return this.aggregate([
    {
      $match: {
        'availableToVendors.vendor': vendorId
      }
    },
    {
      $group: {
        _id: null,
        available: {
          $sum: {
            $cond: [
              { $and: [
                { $in: ['$status', ['available', 'assigned']] },
                { $eq: ['$takenBy', null] }
              ]},
              1,
              0
            ]
          }
        },
        taken: {
          $sum: {
            $cond: [{ $eq: ['$takenBy', vendorId] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Set modifiedBy if not already set
  if (this.isModified() && !this.modifiedBy) {
    // Use the vendor who took it or the admin who assigned it
    this.modifiedBy = this.takenBy || this.availableToVendors?.assignedBy;
  }
  
  next();
});

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema); 