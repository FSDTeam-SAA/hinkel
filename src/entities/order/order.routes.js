import express from 'express';
import { calculatePrice, confirmPayment, getAllOrdersPopulated, getOrdersByUserId, getOrderStats, updateDeliveryStatus } from './order.controller.js';

const router = express.Router();

// Route for calculating the price (user sees this before paying)
router.post('/calculate-price', calculatePrice);
router.patch('/update-delivery-status', updateDeliveryStatus);
// Route for confirming payment and getting the Stripe URL
router.post('/confirm-payment', confirmPayment);
router.get('/user/:userId', getOrdersByUserId);
router.get('/admin/all-orders', getAllOrdersPopulated);

router.get('/admin/dashboard-stats', getOrderStats);
export default router;