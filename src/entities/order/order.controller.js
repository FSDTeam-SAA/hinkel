import Stripe from 'stripe';
import Pricing from '../admin/pricing.model.js';
import Order from './order.model.js';
import User from '../auth/auth.model.js';
import { generateResponse } from '../../lib/responseFormate.js';
import { cloudinaryUpload } from '../../lib/cloudinaryUpload.js';
import { orderService } from './order.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// API 1: Calculate Price for Frontend Preview
export const calculatePrice = async (req, res) => {
  try {
    const { pageCount, deliveryType } = req.body;

    // Fetch the admin-set price for this specific delivery type
    const pricingConfig = await Pricing.findOne({ deliveryType });

    if (!pricingConfig) {
      return res
        .status(404)
        .json({ success: false, message: 'Pricing configuration not found' });
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
    const { pageCount, deliveryType, userId, orderId } = req.body;

    // 1. Re-fetch price from DB to ensure security (prevents frontend manipulation)
    const pricingConfig = await Pricing.findOne({ deliveryType });
    if (!pricingConfig) {
      return res
        .status(404)
        .json({ success: false, message: 'Invalid delivery type' });
    }

    const amountInCents = Math.round(
      pageCount * pricingConfig.pricePerPage * 100
    );

    let finalPageCount = pageCount;
    let finalAmount = amountInCents;
    let existingOrder = null;

    // Check if orderId is provided - if so, we're adding to an existing order
    if (orderId) {
      existingOrder = await Order.findOne({ _id: orderId, userId });
      if (!existingOrder) {
        return res
          .status(404)
          .json({ success: false, message: 'Order not found for this user' });
      }
      // Add new pages to existing order
      finalPageCount = existingOrder.pageCount + pageCount;
      finalAmount = existingOrder.totalAmount + amountInCents;
    }

    // 2. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pricingConfig.currency || 'usd',
            product_data: {
              name: `Service: ${deliveryType}`,
              description: orderId
                ? `Additional payment for ${pageCount} pages (Total: ${finalPageCount} pages)`
                : `Payment for ${pageCount} total pages`
            },
            unit_amount: amountInCents // Charge only for the new pages
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { userId, deliveryType, pageCount, orderId: orderId || '' }
    });

    let resultOrder;

    if (orderId && existingOrder) {
      // Update existing order with increased pageCount and totalAmount
      resultOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          pageCount: finalPageCount,
          totalAmount: finalAmount,
          stripeSessionId: session.id,
          status: 'pending'
        },
        { new: true }
      );
    } else {
      // 3. Save the initial order in the database with email notifications
      resultOrder = await orderService.createOrderInDb({
        userId,
        deliveryType,
        pageCount,
        totalAmount: amountInCents,
        stripeSessionId: session.id,
        status: 'pending'
      });
    }

    res.status(200).json({
      success: true,
      sessionUrl: session.url, // Use this on frontend to redirect
      orderId: resultOrder._id,
      isUpdate: !!orderId,
      totalPageCount: resultOrder.pageCount,
      totalAmount: resultOrder.totalAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, deliveryStatus, approvalStatus, rejectionReason } =
      req.body;

    // Validate that orderId is provided
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    // If rejecting, ensure reason is provided
    if (deliveryStatus === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'rejectionReason is required when rejecting an order'
      });
    }

    // Validate that at least one status is provided
    if (!deliveryStatus && !approvalStatus) {
      return res.status(400).json({
        success: false,
        message:
          'At least one of deliveryStatus or approvalStatus must be provided'
      });
    }

    // Update the delivery status and/or approval status
    // If deliveryStatus is "rejected", it will automatically trigger refund
    const updatedOrder = await orderService.updateOrderDeliveryStatus(
      orderId,
      deliveryStatus,
      approvalStatus,
      rejectionReason
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message:
        deliveryStatus === 'rejected'
          ? 'Order rejected and refund processed successfully'
          : 'Order status updated successfully',
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
          totalRevenueCents: { $sum: '$totalAmount' },
          paidOrdersCount: { $sum: 1 }
        }
      }
    ]);

    // 2. Get User Count
    const totalUsers = await User.countDocuments();

    // Prepare variables for the response
    const revenue =
      orderStats.length > 0
        ? (orderStats[0].totalRevenueCents / 100).toFixed(2)
        : '0.00';
    const paidOrders =
      orderStats.length > 0 ? orderStats[0].paidOrdersCount : 0;

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
    const userOrders = await Order.find({ userId }).sort({ createdAt: -1 }); // Newest orders at the top

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

import fs from 'fs';

/**
 * Check payment status for orders with pending status
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;

    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // If payment is complete, mark order as paid
    if (session.payment_status === 'paid') {
      // Find and update the order
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          status: 'paid',
          stripePaymentIntentId: session.payment_intent
        },
        { new: true }
      );

      if (order) {
        const user = await User.findById(order.userId);
        if (user) {
          // Send payment confirmation emails (non-blocking)
          const { notifyUserPaymentConfirmed, notifyAdminPaymentConfirmed } =
            await import('./orderNotification.service.js');
          notifyUserPaymentConfirmed(order, user).catch((err) => {
            console.error('User payment confirmation email failed:', err);
          });
          notifyAdminPaymentConfirmed(order, user).catch((err) => {
            console.error('Admin payment confirmation email failed:', err);
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed',
        paymentStatus: 'paid',
        orderId: order._id
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: session.payment_status,
      orderId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Refund an order and cancel it
 */
export const refundOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is paid before refunding
    if (order.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Only paid orders can be refunded'
      });
    }

    // If already refunded, return early
    if (order.refundStatus === 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been refunded'
      });
    }

    // Create refund via Stripe using Payment Intent
    let refund = null;
    if (order.stripePaymentIntentId) {
      try {
        refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          metadata: {
            orderId: orderId,
            reason: reason || 'No reason provided'
          }
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(400).json({
          success: false,
          message:
            'Failed to process refund with Stripe: ' + stripeError.message
        });
      }
    }

    // Update order with refund information and cancel status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'cancelled',
        refundId: refund?.id || null,
        refundStatus: refund ? 'succeeded' : 'pending',
        refundAmount: order.totalAmount,
        refundReason: reason || 'User requested refund',
        refundedAt: new Date()
      },
      { new: true }
    );

    // Send refund notification emails
    const user = await User.findById(order.userId);
    if (user) {
      const { notifyUserRefund, notifyAdminRefund } = await import(
        './orderNotification.service.js'
      );
      notifyUserRefund(updatedOrder, user).catch((err) => {
        console.error('User refund email failed:', err);
      });
      notifyAdminRefund(updatedOrder, user).catch((err) => {
        console.error('Admin refund email failed:', err);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order refunded and cancelled successfully',
      data: updatedOrder,
      refund: refund
    });
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
};

/**
 * Upload book image and update the corresponding order
 */
export const uploadBook = async (req, res) => {
  try {
    const { title, orderId, approvalStatus } = req.body;

    if (!orderId || !title) {
      return res.status(400).json({
        success: false,
        message: 'orderId and title are required'
      });
    }

    // 1️⃣ Check if file exists
    const file = req.files?.image?.[0];
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Book image is required'
      });
    }

    // 2️⃣ Upload image to Cloudinary
    const sanitizedTitle = `${title.replace(/\s+/g, '-')}-${Date.now()}`;
    const uploaded = await cloudinaryUpload(file.path, sanitizedTitle, 'items');

    // 3️⃣ Remove temp file
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    if (!uploaded?.secure_url) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload book image'
      });
    }

    // 4️⃣ Update Order document with book URL and send notification
    const updatedOrder = await orderService.updateOrderWithBook(orderId, {
      book: uploaded.secure_url,
      title,
      approvalStatus
    });

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 5️⃣ Send success response
    return res.status(200).json({
      success: true,
      message: 'Book uploaded and order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Upload Book Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload book'
    });
  }
};
