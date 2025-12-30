import mongoose from "mongoose";


const pricingSchema = new mongoose.Schema({
  // Type of service: 'digital', 'print', or 'print_digital'
  deliveryType: {
    type: String,
    required: true,
    unique: true, 
    enum: ['digital', 'print', 'print&digital']
  },
  // The cost the admin charges per page
  pricePerPage: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  }
}, { timestamps: true });

 const Pricing = mongoose.model('Pricing', pricingSchema);
 export default Pricing