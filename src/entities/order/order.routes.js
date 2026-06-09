import express from 'express';
import {
  calculatePrice,
  calculateAdjustment,
  confirmPayment,
  confirmAdjustmentPayment,
  getAllOrdersPopulated,
  getOrdersByUserId,
  getOrderStats,
  updateDeliveryStatus,
  uploadBook,
  refundOrder,
  checkPaymentStatus,
  deleteOrder,
  exportOrders,
  archiveOrder
} from './order.controller.js';
import { viewBookPdf } from './order.pdfProxy.js';
import { multerUpload } from '../../core/middlewares/multer.js';
import {
  adminMiddleware,
  verifyToken
} from '../../core/middlewares/authMiddleware.js';

const router = express.Router();

// Route for calculating the price (user sees this before paying)
router.post('/calculate-price', calculatePrice);

// Route for updating delivery status (admin)
router.patch(
  '/update-delivery-status',
  verifyToken,
  adminMiddleware,
  updateDeliveryStatus
);

// Route for confirming payment and getting the Stripe URL
router.post('/confirm-payment', verifyToken, confirmPayment);
router.post('/calculate-adjustment', verifyToken, calculateAdjustment);
router.post('/confirm-adjustment-payment', verifyToken, confirmAdjustmentPayment);

// Route for checking payment status
router.post('/check-payment-status', checkPaymentStatus);

// Route for refunding an order
router.post('/refund', refundOrder);

// Get orders by user ID
router.get('/user/:userId', getOrdersByUserId);

// Secure PDF viewer proxy (auth required)
router.get('/:orderId/view-pdf', verifyToken, viewBookPdf);

// Admin routes
router.get('/admin/all-orders', getAllOrdersPopulated);
router.get('/admin/export-orders', exportOrders);
router.put('/upload-book', multerUpload([{ name: 'image' }]), uploadBook);
router.get('/admin/dashboard-stats', getOrderStats);
router.delete('/admin/:orderId', deleteOrder);
router.patch('/admin/archive/:orderId', archiveOrder);

export default router;
