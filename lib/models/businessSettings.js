import mongoose from 'mongoose';

const { Schema } = mongoose;

const businessSettingsSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  whatsapp: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  paymentQrCode: {
    type: String,
    default: ''
  },
  paymentUpiId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
businessSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const BusinessSettings = mongoose.model('businesssettings', businessSettingsSchema);

export default BusinessSettings;

