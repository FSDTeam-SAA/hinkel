import mongoose from 'mongoose';

const PricingTierSchema = new mongoose.Schema({
  pageCount: {
    type: Number,
    required: true,
    unique: true
  },
  digitalPrice: {
    type: Number,
    required: true
  },
  printPrice: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('PricingTier', PricingTierSchema);