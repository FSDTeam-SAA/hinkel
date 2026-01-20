import Order from './order.model.js';
import User from '../auth/auth.model.js';
import Stripe from 'stripe';
import {
  notifyUserOrderCreated,
  notifyAdminOrderCreated,
  notifyUserPaymentConfirmed,
  notifyAdminPaymentConfirmed,
  notifyUserBookUploaded,
  notifyUserDeliveryStatusUpdate,
  notifyUserRefund,
  notifyAdminRefund
} from './orderNotification.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  // Fetch user data for email
  const user = await User.findById(order.userId);

  if (user) {
    // Send payment confirmation emails (non-blocking)
    notifyUserPaymentConfirmed(order, user).catch((err) => {
      console.error('User payment confirmation email failed:', err);
    });

    notifyAdminPaymentConfirmed(order, user).catch((err) => {
      console.error('Admin payment confirmation email failed:', err);
    });
  }

  return order;
};

/**
 * Update order with book upload and send notification
 */
export const updateOrderWithBook = async (orderId, bookData) => {
  const order = await Order.findByIdAndUpdate(orderId, bookData, { new: true });

  if (!order) {
    throw new Error('Order not found');
  }

  // Fetch user data for email
  const user = await User.findById(order.userId);

  if (user) {
    // Send book uploaded notification (non-blocking)
    notifyUserBookUploaded(order, user).catch((err) => {
      console.error('User book uploaded email failed:', err);
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
  const oldApprovalStatus = currentOrder.approvalStatus;

  // Check if this is a rejection (deliveryStatus = "rejected")
  const isRejection = newDeliveryStatus === 'rejected';

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

  // ==================== SEND NOTIFICATION FOR STATUS CHANGE ====================
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

export const orderService = {
  createOrderInDb,
  markOrderAsPaid,
  updateOrderWithBook,
  updateOrderDeliveryStatus
};
