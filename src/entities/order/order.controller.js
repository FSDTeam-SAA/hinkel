import Stripe from 'stripe';
import Pricing from '../admin/pricing.model.js';
import Order from './order.model.js';
import User from '../auth/auth.model.js';
import { cloudinaryUpload } from '../../lib/cloudinaryUpload.js';
import { orderService } from './order.service.js';
import { couponService } from '../admin/coupon/coupon.service.js';
import { frontendUrl } from '../../core/config/config.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Sanitize an order object to remove the direct Cloudinary book URL.
 * Replaces it with a hasBook flag and a secure proxy URL.
 */
const sanitizeOrderForResponse = (order) => {
  const obj = order.toObject ? order.toObject() : { ...order };
  const hasBook = !!obj.book;

  // Replace the raw Cloudinary URL with safe alternatives
  obj.hasBook = hasBook;
  obj.bookViewUrl = hasBook ? `/order/${obj._id}/view-pdf` : null;
  // Keep book field for cover image display (Cloudinary can render PDF thumbnails)
  // but mark it as thumbnail-only
  obj.bookThumbnail = obj.book || null;
  delete obj.book;

  return obj;
};

// Helper function to calculate total price based on page tiers
const calculateTotalPrice = (pageCount, pageTiers) => {
  if (!pageTiers || pageTiers.length === 0) {
    return 0;
  }

  // Find the appropriate tier based on pageCount
  // Tiers are sorted by pageLimit in ascending order
  let totalPrice = 0;

  for (const tier of pageTiers) {
    if (pageCount <= tier.pageLimit) {
      totalPrice = tier.price;
      break;
    }
  }

  // If pageCount exceeds all tiers, use the last (highest) tier price
  if (totalPrice === 0 && pageTiers.length > 0) {
    totalPrice = pageTiers[pageTiers.length - 1].price;
  }

  return totalPrice;
};

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

    const totalPrice = calculateTotalPrice(pageCount, pricingConfig.pageTiers);

    res.status(200).json({
      success: true,
      data: {
        pageCount,
        pageTiers: pricingConfig.pageTiers,
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
    const { pageCount, deliveryType, userId, orderId, couponCode } = req.body;

    // 1. Re-fetch price from DB to ensure security (prevents frontend manipulation)
    const pricingConfig = await Pricing.findOne({ deliveryType });
    if (!pricingConfig) {
      return res
        .status(404)
        .json({ success: false, message: 'Invalid delivery type' });
    }

    const totalPrice = calculateTotalPrice(pageCount, pricingConfig.pageTiers);
    let amountInCents = Math.round(totalPrice * 100);

    let couponData = null;
    if (couponCode) {
      try {
        const coupon = await couponService.getCouponByCodeFromDb(couponCode);
        couponData = {
          code: coupon.codeName,
          discountAmount: coupon.discountAmount,
          discountType: coupon.discountType
        };

        if (coupon.discountType === 'flat') {
          amountInCents = Math.max(
            0,
            amountInCents - coupon.discountAmount * 100
          );
        } else if (coupon.discountType === 'percentage') {
          const discount = Math.round(
            (amountInCents * coupon.discountAmount) / 100
          );
          amountInCents = Math.max(0, amountInCents - discount);
        }
      } catch (couponError) {
        return res.status(400).json({
          success: false,
          message: couponError.message || 'Invalid coupon'
        });
      }
    }

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
    const sessionItems = [
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
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: sessionItems,
      mode: 'payment',
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment-cancelled`,
      metadata: {
        userId,
        deliveryType,
        pageCount,
        orderId: orderId || '',
        couponCode: couponCode || ''
      }
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
          status: 'pending',
          appliedCoupon: couponData || existingOrder.appliedCoupon
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
        status: 'pending',
        appliedCoupon: couponData
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
    const {
      page = 1,
      limit = 10,
      status,
      deliveryStatus,
      deliveryType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by payment status
    if (status && status !== 'all') query.status = status;

    // Filter by delivery status
    if (deliveryStatus && deliveryStatus !== 'all')
      query.deliveryStatus = deliveryStatus;

    // Filter by delivery type
    if (deliveryType && deliveryType !== 'all')
      query.deliveryType = deliveryType;

    // Search logic
    if (search) {
      // Find matching users first to filter orders by userId
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map((u) => u._id);

      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { stripeSessionId: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const orders = await Order.find(query)
      .populate('userId')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const totalOrders = await Order.countDocuments(query);

    // Sanitize orders to remove direct Cloudinary book URLs
    const sanitizedOrders = orders.map(sanitizeOrderForResponse);

    res.status(200).json({
      success: true,
      count: sanitizedOrders.length,
      totalCount: totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / limitNum),
      data: sanitizedOrders
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

    // Sanitize orders to remove direct Cloudinary book URLs
    const sanitizedOrders = userOrders.map(sanitizeOrderForResponse);

    res.status(200).json({
      success: true,
      count: sanitizedOrders.length,
      data: sanitizedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete Order - Cannot delete if status is pending
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    // Find the order first
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order status is pending - cannot delete pending orders
    if (order.status === 'pending') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete order with pending status. Please wait until the payment is processed or cancelled.'
      });
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
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

      if (order?.appliedCoupon?.code) {
        await couponService.incrementCouponUsedCount(order.appliedCoupon.code);
      }

      if (order) {
        const user = await User.findById(order.userId);
        if (user) {
          // Update user's subscription status to true
          await User.findByIdAndUpdate(order.userId, { hasActiveSubscription: true });

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

    // 5️⃣ Send success response with sanitized order
    return res.status(200).json({
      success: true,
      message: 'Book uploaded and order updated successfully',
      order: sanitizeOrderForResponse(updatedOrder)
    });
  } catch (error) {
    console.error('Upload Book Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload book'
    });
  }
};

// Export Orders as CSV
export const exportOrders = async (req, res) => {
  try {
    const { status, deliveryStatus, deliveryType, search } = req.query;

    const query = {};

    // Filter by payment status
    if (status && status !== 'all') query.status = status;

    // Filter by delivery status
    if (deliveryStatus && deliveryStatus !== 'all')
      query.deliveryStatus = deliveryStatus;

    // Filter by delivery type
    if (deliveryType && deliveryType !== 'all')
      query.deliveryType = deliveryType;

    // Search logic
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map((u) => u._id);

      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { stripeSessionId: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const orders = await Order.find(query)
      .populate('userId')
      .sort({ createdAt: -1 });

    // CSV Header
    const csvRows = [
      [
        'Order ID',
        'Date',
        'Customer Name',
        'Customer Email',
        'Title',
        'Delivery Type',
        'Page Count',
        'Total Amount ($)',
        'Payment Status',
        'Delivery Status'
      ].join(',')
    ];

    // CSV Data
    orders.forEach((order) => {
      const row = [
        `"${order._id}"`,
        `"${new Date(order.createdAt).toLocaleDateString()}"`,
        `"${order.userId?.name || 'Guest'}"`,
        `"${order.userId?.email || 'N/A'}"`,
        `"${(order.title || 'N/A').replace(/"/g, '""')}"`,
        `"${order.deliveryType}"`,
        order.pageCount,
        (order.totalAmount / 100).toFixed(2),
        `"${order.status}"`,
        `"${order.deliveryStatus || 'pending'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orders-export-${Date.now()}.csv`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ success: false, error: 'Failed to export orders' });
  }
};

/**
 * Archive or unarchive an order (Admin)
 */
export const archiveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive (boolean) is required in request body'
      });
    }

    const updatedOrder = await orderService.toggleOrderArchive(
      orderId,
      isActive
    );

    res.status(200).json({
      success: true,
      message: `Order ${isActive ? 'unarchived' : 'archived'} successfully`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
