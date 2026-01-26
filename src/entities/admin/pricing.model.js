import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema(
  {
    // Type of service: 'digital', 'print', or 'print_digital'
    deliveryType: {
      type: String,
      required: true,
      unique: true,
      enum: ['digital', 'print', 'print&digital']
    },
    // Tiered prices keyed by maximum page count (e.g., 10 pages => 20, 30 pages => -10)
    pageTiers: {
      type: [
        {
          pageLimit: { type: Number, required: true },
          price: { type: Number, required: true }
        }
      ],
      default: [],
      _id:false
    },
    currency: {
      type: String,
      default: 'usd'
    }
  },
  { timestamps: true }
);

const Pricing = mongoose.model('Pricing', pricingSchema);
export default Pricing;
