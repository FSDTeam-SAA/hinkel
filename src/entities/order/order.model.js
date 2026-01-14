import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, // MUST be ObjectId, not String
    ref: 'User', // MUST match the name in mongoose.model('User', ...)
    required: true 
  },
  title:{type:String},
  book:{type:String},
  deliveryType: {
    type: String,
    enum: ['digital', 'print', 'print&digital'],
    required: true
  },
  approvalStatus:{type:String},
  pageCount: { type: Number, required: true },
  totalAmount: { type: Number, required: true }, // Stored in cents for Stripe
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  deliveryStatus:{
 type:String,
 default:'pending'},
  stripeSessionId: { type: String }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order