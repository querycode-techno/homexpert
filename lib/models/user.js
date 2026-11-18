import mongoose from 'mongoose';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India' },
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: false },
    type: {
      type: String,
      enum: ['admin', 'user', 'vendor', 'support_team', 'telecaller', 'helpline'],
      default: 'user',
    },
    employeeId: { type: String, unique: true, sparse: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: false },
    profileImage: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    addresses: [addressSchema],
    notificationPrefs: {
      pushEnabled: { type: Boolean, default: true },
      marketingEnabled: { type: Boolean, default: true },
      cartRecoveryEnabled: { type: Boolean, default: true },
    },
    preferredCategories: [{ type: String }],
    fcmToken: String,
    otpHash: String,
    otpExpiresAt: Date,
    otpAttempts: { type: Number, default: 0 },
    refreshTokenHash: String,
    accountDeletionRequested: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ employeeId: 1 });

userSchema.methods.generateEmployeeId = function () {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `EMP${timestamp}${random}`;
};

userSchema.pre('save', function (next) {
  if (this.isNew && !this.employeeId && this.type !== 'user') {
    this.employeeId = this.generateEmployeeId();
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);
