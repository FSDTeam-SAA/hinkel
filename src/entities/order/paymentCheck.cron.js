import Stripe from 'stripe';
import Order from './order.model.js';
import { orderService } from './order.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Cron Job: Check payment status for all pending orders
 * Runs every 5 seconds to verify Stripe payments
 */
export const checkPendingPaymentsJob = async () => {
  try {
    // Find all orders with status 'pending'
    const pendingOrders = await Order.find({ status: 'pending' }).lean();

    if (pendingOrders.length === 0) {
      return;
    }

    console.log(
      `⏰ Payment Check Job: Found ${pendingOrders.length} pending orders`
    );

    // Check each pending order
    for (const order of pendingOrders) {
      try {
        // Skip if no session ID
        if (!order.stripeSessionId) {
          console.warn(`⚠️ Order ${order._id} has no stripe session ID`);
          continue;
        }

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(
          order.stripeSessionId
        );

        // If payment is successful, settle the order idempotently
        if (session.payment_status === 'paid') {
          console.log(`✅ Payment confirmed for order ${order._id}`);
          await orderService.settleCheckoutSession(session, String(order._id));
        } else if (session.payment_status === 'unpaid') {
          console.log(`⏳ Payment still unpaid for order ${order._id}`);
        }
      } catch (orderError) {
        console.error(
          `❌ Error checking order ${order._id}:`,
          orderError.message
        );
      }
    }
  } catch (error) {
    console.error('❌ Payment check job failed:', error.message);
  }
};

/**
 * Initialize the cron job to run every 5 seconds
 */
export const initPaymentCheckCron = () => {
  console.log('🚀 Payment Check Cron Job initialized (runs every 5 seconds)');

  // Run immediately on startup
  checkPendingPaymentsJob();

  // Run every 5 seconds (5000 milliseconds)
  const interval = setInterval(() => {
    checkPendingPaymentsJob();
  }, 5000);

  // Return the interval ID so it can be cleared if needed
  return interval;
};

/**
 * Stop the cron job
 */
export const stopPaymentCheckCron = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Payment Check Cron Job stopped');
  }
};
