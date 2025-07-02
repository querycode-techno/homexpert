//subscription history
import mongoose from 'mongoose';

const { Schema } = mongoose;

// Purchased Subscription schema for tracking user subscription history and usage
const subscriptionHistorySchema = new Schema({
  // User and Plan Reference
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  subscriptionPlan: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  
  // Subscription Details (snapshot at time of purchase)
  planSnapshot: {
    planName: { type: String, required: true },
    description: String,
    duration: String,
    durationInDays: Number,
    totalLeads: Number,
    leadsPerMonth: Number,
    price: Number,
    discountedPrice: Number,
    features: [{
      name: String,
      description: String,
      isIncluded: Boolean
    }]
  },
  
  // Subscription Period
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Usage Tracking
  usage: {
    leadsConsumed: {
      type: Number,
      default: 0,
      min: 0
    },
    leadsRemaining: {
      type: Number,
      default: 0,
      min: 0
    },
    lastLeadConsumedAt: Date,
    
    // Monthly breakdown
    monthlyUsage: [{
      month: { type: String, required: true }, // "2024-01", "2024-02"
      year: { type: Number, required: true },
      monthNumber: { type: Number, required: true },
      leadsUsed: { type: Number, default: 0 },
      leadsAllocated: { type: Number, default: 0 },
      usagePercentage: { type: Number, default: 0 }
    }],
    
    // Usage statistics
    averageLeadsPerMonth: { type: Number, default: 0 },
    peakUsageMonth: String,
    totalJobsCompleted: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 } // leads to jobs conversion
  },
  
  // Payment Information
  payment: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: {
      type: String,
      enum: ['online', 'bank_transfer'],
      required: true
    },
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'submitted', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date,
    refundAmount: { type: Number, default: 0 },
    refundDate: Date,
    refundReason: String
  },
  
  // Subscription History
  history: [{
    action: {
      type: String,
      enum: ['purchased', 'activated', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'expired'],
      required: true
    },
    date: { type: Date, default: Date.now },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User' // admin who performed the action
    },
    reason: String,
    previousStatus: String,
    newStatus: String,
    metadata: Schema.Types.Mixed // additional data for the action
  }],
  
  // Upgrade/Downgrade Tracking
  previousSubscription: {
    type: Schema.Types.ObjectId,
    ref: 'PurchasedSubscription'
  },
  nextSubscription: {
    type: Schema.Types.ObjectId,
    ref: 'PurchasedSubscription'
  },
  upgradeDowngradeHistory: [{
    fromPlan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    toPlan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['upgrade', 'downgrade'] },
    priceDifference: Number,
    leadsDifference: Number,
    reason: String
  }],
  
  // Renewal Information
  renewalInfo: {
    isAutoRenewal: { type: Boolean, default: false },
    renewalDate: Date,
    renewalAttempts: { type: Number, default: 0 },
    lastRenewalAttempt: Date,
    renewalFailureReason: String,
    nextRenewalPlan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' }
  },
  
  // Admin Management
  adminNotes: [{
    note: { type: String, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }
  }],
  
  // Lead Assignment Tracking
  leadAssignments: [{
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    assignedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['assigned', 'accepted', 'rejected', 'completed', 'cancelled'] },
    completedAt: Date,
    revenue: Number
  }],
  
  // Performance Metrics
  performance: {
    leadAcceptanceRate: { type: Number, default: 0 },
    jobCompletionRate: { type: Number, default: 0 },
    customerSatisfactionScore: { type: Number, default: 0 },
    averageJobValue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },
  
  // Discount and Promotions Applied
  discountsApplied: [{
    discountCode: String,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: Number,
    discountAmount: Number,
    appliedAt: { type: Date, default: Date.now }
  }],
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
subscriptionHistorySchema.index({ user: 1, status: 1 });
subscriptionHistorySchema.index({ user: 1, isActive: 1 });
subscriptionHistorySchema.index({ status: 1, endDate: 1 });
subscriptionHistorySchema.index({ subscriptionPlan: 1 });
subscriptionHistorySchema.index({ startDate: 1, endDate: 1 });
subscriptionHistorySchema.index({ 'payment.paymentStatus': 1 });
subscriptionHistorySchema.index({ 'renewalInfo.renewalDate': 1 });

// Virtual fields
subscriptionHistorySchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return 0;
  const today = new Date();
  const diffTime = this.endDate - today;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

subscriptionHistorySchema.virtual('usagePercentage').get(function() {
  if (!this.planSnapshot.totalLeads) return 0;
  return Math.round((this.usage.leadsConsumed / this.planSnapshot.totalLeads) * 100);
});

subscriptionHistorySchema.virtual('isExpiringSoon').get(function() {
  return this.daysRemaining <= 7 && this.daysRemaining > 0;
});

subscriptionHistorySchema.virtual('isExpired').get(function() {
  return this.daysRemaining <= 0;
});

subscriptionHistorySchema.virtual('totalPaid').get(function() {
  return this.payment.amount - this.payment.refundAmount;
});

subscriptionHistorySchema.virtual('effectivePrice').get(function() {
  return this.planSnapshot.discountedPrice || this.planSnapshot.price;
});

// Instance methods
subscriptionHistorySchema.methods.activate = async function() {
  this.status = 'active';
  this.isActive = true;
  this.history.push({
    action: 'activated',
    newStatus: 'active',
    previousStatus: this.status
  });
  return this.save();
};

subscriptionHistorySchema.methods.deactivate = async function(reason = '') {
  this.status = 'cancelled';
  this.isActive = false;
  this.history.push({
    action: 'cancelled',
    newStatus: 'cancelled',
    previousStatus: 'active',
    reason
  });
  return this.save();
};

subscriptionHistorySchema.methods.consumeLead = async function() {
  if (this.usage.leadsRemaining <= 0) {
    throw new Error('No leads remaining in subscription');
  }
  
  this.usage.leadsConsumed += 1;
  this.usage.leadsRemaining -= 1;
  this.usage.lastLeadConsumedAt = new Date();
  
  // Update monthly usage
  const currentDate = new Date();
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const monthlyUsage = this.usage.monthlyUsage.find(m => m.month === monthKey);
  if (monthlyUsage) {
    monthlyUsage.leadsUsed += 1;
    monthlyUsage.usagePercentage = Math.round((monthlyUsage.leadsUsed / monthlyUsage.leadsAllocated) * 100);
  } else {
    this.usage.monthlyUsage.push({
      month: monthKey,
      year: currentDate.getFullYear(),
      monthNumber: currentDate.getMonth() + 1,
      leadsUsed: 1,
      leadsAllocated: this.planSnapshot.leadsPerMonth,
      usagePercentage: Math.round((1 / this.planSnapshot.leadsPerMonth) * 100)
    });
  }
  
  return this.save();
};

subscriptionHistorySchema.methods.addNote = async function(note, addedBy, isInternal = false) {
  this.adminNotes.push({
    note,
    addedBy,
    isInternal
  });
  return this.save();
};

subscriptionHistorySchema.methods.recordLeadAssignment = async function(leadId, status = 'assigned') {
  this.leadAssignments.push({
    leadId,
    status
  });
  return this.save();
};

subscriptionHistorySchema.methods.updatePerformance = async function() {
  const totalAssignments = this.leadAssignments.length;
  const acceptedLeads = this.leadAssignments.filter(l => l.status === 'accepted').length;
  const completedJobs = this.leadAssignments.filter(l => l.status === 'completed').length;
  
  this.performance.leadAcceptanceRate = totalAssignments > 0 ? Math.round((acceptedLeads / totalAssignments) * 100) : 0;
  this.performance.jobCompletionRate = acceptedLeads > 0 ? Math.round((completedJobs / acceptedLeads) * 100) : 0;
  
  const totalRevenue = this.leadAssignments
    .filter(l => l.revenue)
    .reduce((sum, l) => sum + l.revenue, 0);
  
  this.performance.totalRevenue = totalRevenue;
  this.performance.averageJobValue = completedJobs > 0 ? Math.round(totalRevenue / completedJobs) : 0;
  
  return this.save();
};

// Static methods
subscriptionHistorySchema.statics.getActiveSubscriptions = function(userId = null) {
  const query = { status: 'active', isActive: true };
  if (userId) query.user = userId;
  
  return this.find(query)
    .populate('user', 'name email phone')
    .populate('subscriptionPlan', 'planName duration totalLeads')
    .sort({ startDate: -1 });
};

subscriptionHistorySchema.statics.getExpiringSubscriptions = function(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    status: 'active',
    isActive: true,
    endDate: { $lte: expiryDate, $gte: new Date() }
  })
  .populate('user', 'name email phone')
  .populate('subscriptionPlan', 'planName');
};

subscriptionHistorySchema.statics.getUserSubscriptionHistory = function(userId) {
  return this.find({ user: userId })
    .populate('subscriptionPlan', 'planName duration totalLeads price')
    .sort({ createdAt: -1 });
};

subscriptionHistorySchema.statics.getSubscriptionStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$payment.amount' },
        totalLeadsConsumed: { $sum: '$usage.leadsConsumed' }
      }
    }
  ]);
  
  return stats;
};

subscriptionHistorySchema.statics.getUsageAnalytics = async function(userId = null) {
  const matchStage = userId ? { $match: { user: new mongoose.Types.ObjectId(userId) } } : { $match: {} };
  
  const analytics = await this.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalLeadsConsumed: { $sum: '$usage.leadsConsumed' },
        totalRevenue: { $sum: '$payment.amount' },
        avgUsagePercentage: { $avg: { $multiply: [{ $divide: ['$usage.leadsConsumed', '$planSnapshot.totalLeads'] }, 100] } }
      }
    }
  ]);
  
  return analytics[0] || {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalLeadsConsumed: 0,
    totalRevenue: 0,
    avgUsagePercentage: 0
  };
};

// Pre-save middleware
subscriptionHistorySchema.pre('save', function(next) {
  // Calculate leads remaining
  if (this.isModified('usage.leadsConsumed') || this.isNew) {
    this.usage.leadsRemaining = Math.max(0, this.planSnapshot.totalLeads - this.usage.leadsConsumed);
  }
  
  // Set end date if not provided
  if (this.isNew && !this.endDate && this.planSnapshot.durationInDays) {
    this.endDate = new Date(this.startDate.getTime() + (this.planSnapshot.durationInDays * 24 * 60 * 60 * 1000));
  }
  
  // Auto-expire subscription if past end date
  if (this.endDate && this.endDate < new Date() && this.status === 'active') {
    this.status = 'expired';
    this.isActive = false;
    this.history.push({
      action: 'expired',
      newStatus: 'expired',
      previousStatus: 'active'
    });
  }
  
  next();
});

export default mongoose.models.SubscriptionHistory || mongoose.model('SubscriptionHistory', subscriptionHistorySchema); 