import mongoose from 'mongoose';

const { Schema } = mongoose;

// Lead schema based on lead management component
const leadSchema = new Schema({
  // Basic Information

  userDetails: {
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
    },
    address: {
        type: {
            type: String,
            required: true,
            trim: true
        },
        houseRoomNumber: {
            type: String,
            required: true,
            trim: true
        },
        currentLocation: {
            type: String,
            required: false,
            trim: true
        },
        landmark: {
            type: String,
            required: false,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true  
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true,
            default: 'India'
        },
        pincode: {
            type: String,
            required: true,
            trim: true
        }
    },
},
  
  // Service Information
  selectedService: {
    type: String,
    required: true,
  },
  
  // Lead Status
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Assigned', 'Cancelled', 'Completed'],
    default: 'Active'
  },
  
  // Assignment Information (array of user ids)
  availableTo: {
    type: Array,
    default: []
  },

  takenBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

takenAt: {    
    type: Date,
    required: false
  },
  // Notes and additional information
  notes: {
    type: String,
    trim: true
  },
  
  // Lead conversion tracking
  convertedAt: {
    type: Date
  },
  conversionValue: {
    type: Number,
    min: 0
  },

  followUpHistory: {
    type: Array,
    default: []
  },

  leadProgressHistory: {
    type: Array,
    default: []
  },

  leadScore: {
    type: Number,
    default: 0
  },
  
  // Admin tracking
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

// Indexes for performance
leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ service: 1 });
leadSchema.index({ location: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ source: 1 });

// Compound indexes
leadSchema.index({ service: 1, location: 1 });
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ assignedTo: 1, status: 1 });

// Virtual fields
leadSchema.virtual('isAssigned').get(function() {
  return this.assignedTo !== null;
});

leadSchema.virtual('isConverted').get(function() {
  return this.status === 'Converted';
});

leadSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

leadSchema.virtual('assignedVendorName', {
  ref: 'Vendor',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// Instance methods
leadSchema.methods.assignToVendor = function(vendorId, userId = null) {
  this.assignedTo = vendorId;
  this.assignedAt = new Date();
  this.status = 'Assigned';
  if (userId) {
    this.modifiedBy = userId;
  }
  return this.save();
};

leadSchema.methods.markAsConverted = function(conversionValue = null, userId = null) {
  this.status = 'Converted';
  this.convertedAt = new Date();
  if (conversionValue) {
    this.conversionValue = conversionValue;
  }
  if (userId) {
    this.modifiedBy = userId;
  }
  return this.save();
};

leadSchema.methods.updateStatus = function(newStatus, userId = null) {
  this.status = newStatus;
  this.lastContactedAt = new Date();
  if (userId) {
    this.modifiedBy = userId;
  }
  return this.save();
};

// Static methods
leadSchema.statics.findUnassigned = function() {
  return this.find({ assignedTo: null });
};

leadSchema.statics.findByVendor = function(vendorId) {
  return this.find({ assignedTo: vendorId }).populate('assignedTo');
};

leadSchema.statics.findByService = function(service) {
  return this.find({ service });
};

leadSchema.statics.findByLocation = function(location) {
  return this.find({ location });
};

leadSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

leadSchema.statics.getLeadStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$estimatedValue' }
      }
    }
  ]);
};

leadSchema.statics.getServiceStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$service',
        count: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Set assignedAt when assigning for the first time
  if (this.isModified('assignedTo') && this.assignedTo && !this.assignedAt) {
    this.assignedAt = new Date();
  }
  
  // Set convertedAt when status changes to Converted
  if (this.isModified('status') && this.status === 'Converted' && !this.convertedAt) {
    this.convertedAt = new Date();
  }
  
  next();
});

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema); 