
import Stripe from 'stripe';
import Pricing from '../admin/pricing.model.js';
import Order from './order.model.js';
import User from '../auth/auth.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// API 1: Calculate Price for Frontend Preview
export const calculatePrice = async (req, res) => {
  try {
    const { pageCount, deliveryType } = req.body;

    // Fetch the admin-set price for this specific delivery type
    const pricingConfig = await Pricing.findOne({ deliveryType });
    
    if (!pricingConfig) {
      return res.status(404).json({ success: false, message: "Pricing configuration not found" });
    }

    const totalPrice = pageCount * pricingConfig.pricePerPage;

    res.status(200).json({ 
      success: true, 
      data: {
        pageCount,
        pricePerPage: pricingConfig.pricePerPage,
        totalPrice: totalPrice.toFixed(2),
        currency: pricingConfig.currency
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// API 2: Confirm Payment & Create Stripe Session
export const confirmPayment = async (req, res) => {
  try {
    const { pageCount, deliveryType, userId } = req.body;

    // 1. Re-fetch price from DB to ensure security (prevents frontend manipulation)
    const pricingConfig = await Pricing.findOne({ deliveryType });
    if (!pricingConfig) {
      return res.status(404).json({ success: false, message: "Invalid delivery type" });
    }

    const amountInCents = Math.round(pageCount * pricingConfig.pricePerPage * 100);

    // 2. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: pricingConfig.currency || 'usd',
          product_data: {
            name: `Service: ${deliveryType}`,
            description: `Payment for ${pageCount} total pages`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { userId, deliveryType, pageCount }
    });

    // 3. Save the initial order in the database
    const newOrder = await Order.create({
      userId,
      deliveryType,
      pageCount,
      totalAmount: amountInCents,
      stripeSessionId: session.id,
      status: 'pending'
    });

    res.status(200).json({ 
      success: true, 
      sessionUrl: session.url, // Use this on frontend to redirect
      orderId: newOrder._id 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, deliveryStatus } = req.body;

    // 1. Find the order and update the deliveryStatus field
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { deliveryStatus: deliveryStatus },
      { new: true } // returns the document after update
    );

    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Delivery status updated successfully",
      data: updatedOrder 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


export const getOrderStats = async (req, res) => {
  try {
    // 1. Get Financial Stats (Revenue and Paid Order Count)
    const orderStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenueCents: { $sum: "$totalAmount" },
          paidOrdersCount: { $sum: 1 }
        }
      }
    ]);

    // 2. Get User Count
    const totalUsers = await User.countDocuments();

    // Prepare variables for the response
    const revenue = orderStats.length > 0 ? (orderStats[0].totalRevenueCents / 100).toFixed(2) : "0.00";
    const paidOrders = orderStats.length > 0 ? orderStats[0].paidOrdersCount : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenue,
        paidOrdersCount: paidOrders,
        totalUsersCount: totalUsers // Added user count here
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


export const getAllOrdersPopulated = async (req, res) => {
  try {
    // .populate('userId') assumes the 'userId' field in your Order model 
    // has a 'ref' pointing to the 'User' model.
    const orders = await Order.find()
      .populate('userId') 
      .sort({ createdAt: -1 }); // Show newest orders first

    res.status(200).json({ 
      success: true, 
      count: orders.length,
      data: orders 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all orders where userId matches the URL parameter
    const userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 }); // Newest orders at the top

    res.status(200).json({ 
      success: true, 
      count: userOrders.length,
      data: userOrders 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};