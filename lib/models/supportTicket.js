import mongoose from 'mongoose';

const { Schema } = mongoose;

// Support Ticket schema with thread messaging
const supportTicketSchema = new Schema({
  // Ticket Identification
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Ticket Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'technical_issue',
      'billing_support', 
      'account_access',
      'lead_management',
      'subscription_issue',
      'profile_verification',
      'payment_issue',
      'feature_request',
      'general_inquiry',
      'urgent_support'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_for_vendor', 'waiting_for_admin', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  // Parties Involved
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdByType: {
    type: String,
    required: true // Will store role name like 'vendor', 'admin', 'helpline', etc.
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedToType: {
    type: String // Will store role name of assigned user
  },
  
  // Vendor Information (if created by vendor)
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  },
  
  // Messages Thread
  messages: [{
    messageId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      required: true // Will store role name or 'system' for system messages
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'system_notification'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      url: String,
      fileType: String,
      fileSize: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    isInternal: {
      type: Boolean,
      default: false // true for admin-only notes
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    editedAt: Date,
    deletedAt: Date
  }],
  
  // Tags and Labels
  tags: [{
    type: String,
    trim: true
  }],
  
  // Related Data
  relatedTickets: [{
    type: Schema.Types.ObjectId,
    ref: 'SupportTicket'
  }],
  relatedLead: {
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  },
  relatedSubscription: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionHistory'
  },
  
  // Escalation
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    escalationReason: String,
    escalationLevel: {
      type: String,
      enum: ['level_1', 'level_2', 'level_3', 'management'],
      default: 'level_1'
    }
  },
  
  // SLA and Timing
  sla: {
    responseTime: {
      type: Number, // in minutes
      default: 240 // 4 hours default
    },
    resolutionTime: {
      type: Number, // in minutes  
      default: 1440 // 24 hours default
    },
    firstResponseAt: Date,
    lastResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date
  },
  
  // Satisfaction Rating
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date,
    ratedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    device: String,
    browser: String,
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'admin_panel', 'system'],
      default: 'web'
    }
  },
  
  // Auto-generated fields
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    vendor: { type: Number, default: 0 },
    admin: { type: Number, default: 0 }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
supportTicketSchema.index({ ticketId: 1 });
supportTicketSchema.index({ createdBy: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ vendorId: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ lastActivity: -1 });

// Virtual fields
supportTicketSchema.virtual('isOverdue').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') return false;
  
  const now = new Date();
  const createdAt = this.createdAt;
  const responseTime = this.sla.responseTime * 60 * 1000; // convert to milliseconds
  
  return (now - createdAt) > responseTime;
});

supportTicketSchema.virtual('responseTimeRemaining').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') return 0;
  
  const now = new Date();
  const createdAt = this.createdAt;
  const responseTime = this.sla.responseTime * 60 * 1000;
  const elapsed = now - createdAt;
  
  return Math.max(0, responseTime - elapsed);
});

supportTicketSchema.virtual('messageCount').get(function() {
  return this.messages ? this.messages.length : 0;
});

supportTicketSchema.virtual('lastMessage').get(function() {
  if (!this.messages || this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
});

// Pre-save middleware
supportTicketSchema.pre('save', function(next) {
  // Generate ticket ID if new
  if (this.isNew && !this.ticketId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.ticketId = `TKT${timestamp}${random}`;
  }
  
  // Update last activity
  this.lastActivity = new Date();
  
  // Set SLA based on priority
  if (this.isNew) {
    switch (this.priority) {
      case 'urgent':
        this.sla.responseTime = 60; // 1 hour
        this.sla.resolutionTime = 480; // 8 hours
        break;
      case 'high':
        this.sla.responseTime = 120; // 2 hours
        this.sla.resolutionTime = 720; // 12 hours
        break;
      case 'medium':
        this.sla.responseTime = 240; // 4 hours
        this.sla.resolutionTime = 1440; // 24 hours
        break;
      case 'low':
        this.sla.responseTime = 480; // 8 hours
        this.sla.resolutionTime = 2880; // 48 hours
        break;
    }
  }
  
  next();
});

// Instance methods
supportTicketSchema.methods.addMessage = function(messageData) {
  const messageId = `MSG${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const message = {
    messageId,
    ...messageData,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  
  // Update unread counts
  if (messageData.senderType === 'vendor') {
    this.unreadCount.admin += 1;
  } else if (messageData.senderType !== 'vendor' && messageData.senderType !== 'system') {
    // Any non-vendor, non-system role (admin, helpline, telecaller, etc.) increments vendor unread count
    this.unreadCount.vendor += 1;
  }
  
  // Set first response time
  if (!this.sla.firstResponseAt && messageData.senderType !== this.createdByType) {
    this.sla.firstResponseAt = new Date();
  }
  
  this.sla.lastResponseAt = new Date();
  this.lastActivity = new Date();
  
  return message;
};

supportTicketSchema.methods.markAsRead = function(userId, userType) {
  // Reset unread count for user type
  if (userType === 'vendor') {
    this.unreadCount.vendor = 0;
  } else if (userType !== 'vendor') {
    // Any non-vendor role (admin, helpline, telecaller, etc.) resets admin unread count
    this.unreadCount.admin = 0;
  }
  
  // Mark messages as read
  this.messages.forEach(message => {
    const existingRead = message.readBy.find(r => r.user.toString() === userId.toString());
    if (!existingRead) {
      message.readBy.push({
        user: userId,
        readAt: new Date()
      });
    }
  });
};

supportTicketSchema.methods.escalate = function(escalatedBy, reason, level = 'level_2') {
  this.escalation = {
    isEscalated: true,
    escalatedAt: new Date(),
    escalatedBy,
    escalationReason: reason,
    escalationLevel: level
  };
  
  // Add system message
  this.addMessage({
    content: `Ticket escalated to ${level} by admin. Reason: ${reason}`,
    sender: escalatedBy,
    senderType: 'system',
    messageType: 'system_notification'
  });
  
  // Update priority if not already urgent
  if (this.priority !== 'urgent') {
    this.priority = 'high';
  }
};

supportTicketSchema.methods.resolve = function(resolvedBy, resolutionNote, resolverRole = 'admin') {
  this.status = 'resolved';
  this.sla.resolvedAt = new Date();
  
  if (resolutionNote) {
    this.addMessage({
      content: resolutionNote,
      sender: resolvedBy,
      senderType: resolverRole,
      messageType: 'system_notification'
    });
  }
};

supportTicketSchema.methods.close = function(closedBy, closingNote, closerRole = 'admin') {
  this.status = 'closed';
  this.sla.closedAt = new Date();
  
  if (closingNote) {
    this.addMessage({
      content: closingNote,
      sender: closedBy,
      senderType: closerRole,
      messageType: 'system_notification'
    });
  }
};

// Static methods
supportTicketSchema.statics.findByVendor = function(vendorId, options = {}) {
  const query = { vendorId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ lastActivity: -1 });
};

supportTicketSchema.statics.findByAssignee = function(assigneeId, options = {}) {
  const query = { assignedTo: assigneeId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('vendorId', 'businessName')
    .sort({ priority: -1, lastActivity: -1 });
};

supportTicketSchema.statics.getTicketStats = function(vendorId = null) {
  const matchStage = vendorId ? { vendorId: new mongoose.Types.ObjectId(vendorId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageResponseTime: { $avg: '$sla.responseTime' }
      }
    }
  ]);
};

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema); 