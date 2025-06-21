// src/lib/models/Role.js
import mongoose from 'mongoose';
import Permission from './permission';
const { Schema } = mongoose;

// Role schema
const roleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: Permission
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ isSystemRole: 1 });

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function() {
  return this.permissions ? this.permissions.length : 0;
});

// Instance methods
roleSchema.methods.hasPermission = function(permissionId) {
  return this.permissions.some(p => p.toString() === permissionId.toString());
};

roleSchema.methods.addPermission = async function(permissionId) {
  if (!this.hasPermission(permissionId)) {
    this.permissions.push(permissionId);
    await this.save();
  }
  return this;
};

roleSchema.methods.removePermission = async function(permissionId) {
  this.permissions = this.permissions.filter(p => p.toString() !== permissionId.toString());
  await this.save();
  return this;
};

// Static methods
roleSchema.statics.findSystemRoles = function() {
  return this.find({ isSystemRole: true });
};

roleSchema.statics.findCustomRoles = function() {
  return this.find({ isSystemRole: false });
};

roleSchema.statics.findWithPermissions = function() {
  return this.find().populate('permissions');
};

export default mongoose.models.Role || mongoose.model('Role', roleSchema);