import Order from './order.model.js';
import User from '../auth/auth.model.js';
import Stripe from 'stripe';
import {
  notifyUserOrderCreated,
  notifyAdminOrderCreated,
  notifyUserPaymentConfirmed,
  notifyAdminPaymentConfirmed,
  notifyUserBookPendingReview,
  notifyUserBookApproved,
  notifyUserDeliveryStatusUpdate,
  notifyUserRefund,
  notifyAdminRefund
} from './orderNotification.service.js';
import { getAdjustmentQuote } from './orderPricing.service.js';
import { couponService } from '../admin/coupon/coupon.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ADJUSTMENT_CHECKOUT_INTENTS = new Set([
  'add_pages_checkout',
  'package_upgrade_checkout'
]);

const uniqueSessionIds = (sessionIds = [], newSessionId) => {
  const ids = new Set(sessionIds);
  if (newSessionId) {
    ids.add(newSessionId);
  }
  return [...ids];
};

const syncUserPaymentAccess = async (userId) => {
  await User.findByIdAndUpdate(userId, { hasActiveSubscription: true });
};

const sendPaymentConfirmedNotifications = async (order) => {
  const user = await User.findById(order.userId);

  if (!user) {
    return;
  }

  await syncUserPaymentAccess(order.userId);

  notifyUserPaymentConfirmed(order, user).catch((err) => {
    console.error('User payment confirmation email failed:', err);
  });

  notifyAdminPaymentConfirmed(order, user).catch((err) => {
    console.error('Admin payment confirmation email failed:', err);
  });
};

/**
 * Create a new order and send notifications
 */
export const createOrderInDb = async (orderData) => {
  const order = await Order.create(orderData);

  // Fetch user data for email
  const user = await User.findById(orderData.userId);

  if (user) {
    // Send notifications (non-blocking)
    notifyUserOrderCreated(order, user).catch((err) => {
      console.error('User order created email failed:', err);
    });

    notifyAdminOrderCreated(order, user).catch((err) => {
      console.error('Admin order created email failed:', err);
    });
  }

  return order;
};

/**
 * Update order to paid status and send payment confirmation emails
 */
export const markOrderAsPaid = async (orderId) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: 'paid' },
    { new: true }
  );

  if (!order) {
    throw new Error('Order not found');
  }

  await sendPaymentConfirmedNotifications(order);

  return order;
};

export const settleCheckoutSession = async (session, orderIdOverride = null) => {
  if (!session) {
    throw new Error('Stripe session is required');
  }

  if (session.payment_status !== 'paid') {
    return {
      order: null,
      settled: false,
      paymentStatus: session.payment_status
    };
  }

  const metadata = session.metadata || {};
  const checkoutIntent = metadata.checkoutIntent || 'initial_checkout';
  const orderId = orderIdOverride || metadata.orderId;

  if (!orderId) {
    throw new Error('Order ID is missing from the checkout session');
  }

  const currentOrder = await Order.findById(orderId);

  if (!currentOrder) {
    throw new Error('Order not found');
  }

  if (currentOrder.processedCheckoutSessionIds?.includes(session.id)) {
    return {
      order: currentOrder,
      settled: true,
      paymentStatus: session.payment_status
    };
  }

  if (ADJUSTMENT_CHECKOUT_INTENTS.has(checkoutIntent)) {
    const targetDeliveryType = metadata.targetDeliveryType;
    const targetPageCount = Number(metadata.targetPageCount);

    if (!targetDeliveryType || !Number.isFinite(targetPageCount)) {
      throw new Error('Adjustment checkout metadata is incomplete');
    }

    const quote = await getAdjustmentQuote({
      existingOrder: currentOrder,
      targetDeliveryType,
      targetPageCount
    });

    const updatedOrder = await Order.findByIdAndUpdate(
      currentOrder._id,
      {
        deliveryType: quote.targetDeliveryType,
        pageCount: quote.targetPageCount,
        totalAmount: quote.targetTotalCents,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        processedCheckoutSessionIds: uniqueSessionIds(
          currentOrder.processedCheckoutSessionIds,
          session.id
        )
      },
      { new: true }
    );

    await syncUserPaymentAccess(updatedOrder.userId);

    return {
      order: updatedOrder,
      settled: true,
      paymentStatus: session.payment_status
    };
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    currentOrder._id,
    {
      status: 'paid',
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      processedCheckoutSessionIds: uniqueSessionIds(
        currentOrder.processedCheckoutSessionIds,
        session.id
      )
    },
    { new: true }
  );

  if (updatedOrder?.appliedCoupon?.code) {
    await couponService.incrementCouponUsedCount(updatedOrder.appliedCoupon.code);
  }

  await sendPaymentConfirmedNotifications(updatedOrder);

  return {
    order: updatedOrder,
    settled: true,
    paymentStatus: session.payment_status
  };
};

/**
 * Update order with book upload and notify user that review is pending
 */
export const updateOrderWithBook = async (orderId, bookData) => {
  let order;
  
  // Try to find by database ID if it looks like one, otherwise try Stripe session ID
  if (orderId && orderId.length === 24 && /^[0-9a-fA-F]+$/.test(orderId)) {
    order = await Order.findById(orderId);
  } else {
    order = await Order.findOne({ stripeSessionId: orderId });
  }

  if (!order) {
    throw new Error('Order not found');
  }

  // Update the order
  Object.assign(order, bookData);
  await order.save();

  // Fetch user data for email
  const user = await User.findById(order.userId);

  if (user) {
    // Send pending review notification (non-blocking)
    notifyUserBookPendingReview(order, user).catch((err) => {
      console.error('User pending review email failed:', err);
    });
  }

  return order;
};

/**
 * Update delivery status and/or approval status
 * If deliveryStatus is "rejected", automatically process refund
 * Can update both, or just one of them
 */
export const updateOrderDeliveryStatus = async (
  orderId,
  newDeliveryStatus,
  newApprovalStatus,
  rejectionReason = null
) => {
  // Get current order to track old status
  const currentOrder = await Order.findById(orderId);

  if (!currentOrder) {
    throw new Error('Order not found');
  }

  const oldDeliveryStatus = currentOrder.deliveryStatus;

  // Check if this is a rejection (deliveryStatus = "rejected")
  const isRejection = newDeliveryStatus === 'rejected';
  const isApproval = newDeliveryStatus === 'approved';

  // Build update object with only provided fields
  const updateData = {};

  if (newDeliveryStatus) {
    updateData.deliveryStatus = newDeliveryStatus;
  }

  if (newApprovalStatus) {
    updateData.approvalStatus = newApprovalStatus;
  }

  // Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    return currentOrder;
  }

  // Update the order with provided fields
  const order = await Order.findByIdAndUpdate(orderId, updateData, {
    new: true
  });

  // Fetch user data for email
  const user = await User.findById(order.userId);

  // ==================== HANDLE REJECTION & REFUND ====================
  if (isRejection && order.status === 'paid') {
    try {
      // Create refund via Stripe using Payment Intent
      let refund = null;
      if (order.stripePaymentIntentId) {
        try {
          refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            metadata: {
              orderId: orderId,
              reason: rejectionReason || 'Order rejected'
            }
          });
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
          throw new Error('Failed to process refund: ' + stripeError.message);
        }
      }

      // Update order with refund information and cancel status
      const refundedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          status: 'cancelled',
          refundId: refund?.id || null,
          refundStatus: refund ? 'succeeded' : 'pending',
          refundAmount: order.totalAmount,
          refundReason: rejectionReason || 'Order rejected by admin',
          refundedAt: new Date()
        },
        { new: true }
      );

      // Send refund notification emails
      if (user) {
        notifyUserRefund(refundedOrder, user).catch((err) => {
          console.error('User refund email failed:', err);
        });

        notifyAdminRefund(refundedOrder, user).catch((err) => {
          console.error('Admin refund email failed:', err);
        });
      }

      console.log(`✅ Order ${orderId} rejected and refunded successfully`);
      return refundedOrder;
    } catch (refundError) {
      console.error('Refund processing error:', refundError);
      throw refundError;
    }
  }

  if (isRejection && user) {
    notifyUserRefund(order, user).catch((err) => {
      console.error('User rejection email failed:', err);
    });
    return order;
  }

  // ==================== SEND NOTIFICATION FOR STATUS CHANGE ====================
  if (user && oldDeliveryStatus !== newDeliveryStatus && isApproval) {
    notifyUserBookApproved(order, user).catch((err) => {
      console.error('User book approval email failed:', err);
    });
    return order;
  }

  // Send notification if delivery status changed (and not a rejection, as rejection sends refund emails)
  if (user && oldDeliveryStatus !== newDeliveryStatus && !isRejection) {
    // Send delivery status update notification (non-blocking)
    notifyUserDeliveryStatusUpdate(
      order,
      user,
      oldDeliveryStatus,
      newDeliveryStatus
    ).catch((err) => {
      console.error('User delivery status update email failed:', err);
    });
  }

  return order;
};

/**
 * Toggle the isActive status of an order (archive/unarchive)
 */
export const toggleOrderArchive = async (orderId, isActive) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { isActive },
    { new: true }
  );

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

export const orderService = {
  createOrderInDb,
  markOrderAsPaid,
  settleCheckoutSession,
  updateOrderWithBook,
  updateOrderDeliveryStatus,
  toggleOrderArchive
};
