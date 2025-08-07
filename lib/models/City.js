import mongoose from 'mongoose'

const citySchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Compound index for state and city to ensure uniqueness
citySchema.index({ state: 1, city: 1 }, { unique: true })

// Text index for search functionality
citySchema.index({ state: 'text', city: 'text' })

const City = mongoose.models.City || mongoose.model('City', citySchema)

export default City
