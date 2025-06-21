// src/lib/models/Permission.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

// Permission schema
const permissionSchema = new Schema({
  module: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    enum: ['view', 'create', 'update', 'delete', 'all'],
    required: true
  },
  resource: {
    type: String,
    required: true,
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a compound index for module, action, resource
permissionSchema.index({ module: 1, action: 1, resource: 1 }, { unique: true });

// Virtual field for permission name
permissionSchema.virtual('name').get(function() {
  return `${this.resource}.${this.action}`;
});

// Instance methods
permissionSchema.methods.isAllAccess = function() {
  return this.resource === '*' && this.action === 'all';
};

// Static methods
permissionSchema.statics.findByModule = function(module) {
  return this.find({ module });
};

permissionSchema.statics.findByResource = function(resource) {
  return this.find({ resource });
};

export default mongoose.models.Permission || mongoose.model('Permission', permissionSchema);