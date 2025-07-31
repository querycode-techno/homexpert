import mongoose from 'mongoose';

const { Schema } = mongoose;

// Subscription Plan schema for admin-created subscription packages
const subscriptionPlanSchema = new Schema({
  // Plan identification
  planName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Plan configuration
  duration: {
    type: String,
    enum: ['1-month', '3-month', '6-month', '12-month'],
    required: true
  },
  durationInDays: {
    type: Number,
    required: true
  },
  
  // Lead allocation
  totalLeads: {
    type: Number,
    required: true,
    min: 1
  },
  leadsPerMonth: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: {
    type: Number, // For showing discounts
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Plan settings
  isActive: {
    type: Boolean,
    default: true
  },

  // Custom plans
  isCustom: {
    type: Boolean,
    default: false
  },
  assignedToVendors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Features
  features: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    isIncluded: {
      type: Boolean,
      default: true
    }
  }],
  
  // Limits and restrictions
  limitations: {
    maxActiveLeads: Number,
    leadRefreshInterval: Number, // in days
    supportLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic'
    }
  },
  
  // Admin metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  notes: String,
  tncLink: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
subscriptionPlanSchema.index({ planName: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ duration: 1, isActive: 1 });
subscriptionPlanSchema.index({ price: 1 });

// Virtual fields
subscriptionPlanSchema.virtual('discountPercentage').get(function() {
  if (!this.discountedPrice || this.discountedPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
});

subscriptionPlanSchema.virtual('pricePerLead').get(function() {
  const effectivePrice = this.discountedPrice || this.price;
  return Math.round(effectivePrice / this.totalLeads);
});

subscriptionPlanSchema.virtual('monthlyEquivalent').get(function() {
  const durationMap = {
    '1-month': 1,
    '3-month': 3,
    '6-month': 6,
    '12-month': 12
  };
  const months = durationMap[this.duration] || 1;
  const effectivePrice = this.discountedPrice || this.price;
  return Math.round(effectivePrice / months);
});

subscriptionPlanSchema.virtual('isDiscounted').get(function() {
  return this.discountedPrice && this.discountedPrice < this.price;
});

subscriptionPlanSchema.virtual('effectivePrice').get(function() {
  return this.discountedPrice || this.price;
});

// Instance methods
subscriptionPlanSchema.methods.activate = async function() {
  this.isActive = true;
  return this.save();
};

subscriptionPlanSchema.methods.deactivate = async function() {
  this.isActive = false;
  return this.save();
};

subscriptionPlanSchema.methods.updateFeatures = async function(features) {
  this.features = features;
  return this.save();
};

subscriptionPlanSchema.methods.applyDiscount = async function(discountedPrice) {
  if (discountedPrice >= this.price) {
    throw new Error('Discounted price must be less than original price');
  }
  this.discountedPrice = discountedPrice;
  return this.save();
};

subscriptionPlanSchema.methods.removeDiscount = async function() {
  this.discountedPrice = undefined;
  return this.save();
};

// Static methods
subscriptionPlanSchema.statics.getActivePlans = function(sortBy = 'price') {
  const sortOptions = {
    price: { price: 1 },
    duration: { durationInDays: 1 },
    name: { planName: 1 },
    leads: { totalLeads: 1 }
  };
  
  return this.find({ isActive: true })
    .sort(sortOptions[sortBy] || sortOptions.price)
    .populate('createdBy', 'name email');
};

subscriptionPlanSchema.statics.getPlansByDuration = function(duration) {
  return this.find({ 
    duration: duration, 
    isActive: true 
  }).sort({ price: 1 });
};

subscriptionPlanSchema.statics.getPlanStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPlans: { $sum: 1 },
        activePlans: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
        },
        averagePrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        totalLeads: { $sum: "$totalLeads" }
      }
    }
  ]);
  
  return stats[0] || {
    totalPlans: 0,
    activePlans: 0,
    averagePrice: 0,
    minPrice: 0,
    maxPrice: 0,
    totalLeads: 0
  };
};

subscriptionPlanSchema.statics.searchPlans = function(searchTerm, options = {}) {
  const {
    isActive = null,
    minPrice = null,
    maxPrice = null,
    duration = null
  } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$or = [
      { planName: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }
  
  if (isActive !== null) {
    query.isActive = isActive;
  }
  
  if (minPrice !== null || maxPrice !== null) {
    query.price = {};
    if (minPrice !== null) query.price.$gte = minPrice;
    if (maxPrice !== null) query.price.$lte = maxPrice;
  }
  
  if (duration) {
    query.duration = duration;
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort({ price: 1 });
};

// Pre-save middleware
subscriptionPlanSchema.pre('save', function(next) {
  // Calculate duration in days
  const durationMap = {
    '1-month': 30,
    '3-month': 90,
    '6-month': 180,
    '12-month': 365
  };
  
  if (this.isModified('duration')) {
    this.durationInDays = durationMap[this.duration] || 30;
  }
  
  // Auto-calculate leadsPerMonth if not set
  if (this.isModified('totalLeads') || this.isModified('duration')) {
    const months = this.durationInDays / 30;
    this.leadsPerMonth = Math.ceil(this.totalLeads / months);
  }
  
  // Ensure discountedPrice is not greater than price
  if (this.discountedPrice && this.discountedPrice >= this.price) {
    this.discountedPrice = undefined;
  }
  
  next();
});

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema); 