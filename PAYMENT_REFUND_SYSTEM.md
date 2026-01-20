# Order Payment & Refund System - Updated Documentation

## Overview

This document outlines the updated order management system with:

- **Cron Job** for automatic payment verification (every 5 seconds)
- **Refund API** with automatic order cancellation
- **Removed Webhook** approach (replaced by polling-based cron job)

---

## 1. Payment Verification Flow (Cron Job)

### How It Works

- **Runs every 5 seconds** to check for payment completion
- **Automatically detects** when Stripe payment is successful
- **Updates order status** from 'pending' to 'paid'
- **Sends confirmation emails** to user and admin

### Cron Job File

**Location:** [src/entities/order/paymentCheck.cron.js](src/entities/order/paymentCheck.cron.js)

```javascript
// Initializes in app.js on server startup
initPaymentCheckCron(); // Runs every 5 seconds
```

### Process:

1. Find all orders with status 'pending'
2. For each order, retrieve session from Stripe using `stripeSessionId`
3. Check if `session.payment_status === 'paid'`
4. If paid:
   - Update order status to 'paid'
   - Store `stripePaymentIntentId` for future refunds
   - Send confirmation emails (user + admin)
5. Log all activities

### Logs

```
✅ Payment confirmed for order 123456
⏳ Payment still unpaid for order 789012
⚠️ Order has no stripe session ID
❌ Error checking order
```

---

## 2. Refund API

### Endpoint

```
POST /api/orders/refund
```

### Request Body

```json
{
  "orderId": "order_id_here",
  "reason": "Customer requested refund (optional)"
}
```

### Response

```json
{
  "success": true,
  "message": "Order refunded and cancelled successfully",
  "data": {
    "_id": "order_id",
    "status": "cancelled",
    "refundStatus": "succeeded",
    "refundId": "stripe_refund_id",
    "refundAmount": 5000,
    "refundReason": "Customer requested refund",
    "refundedAt": "2025-01-21T10:30:00Z"
  },
  "refund": {
    "id": "re_...",
    "object": "refund",
    "amount": 5000,
    "status": "succeeded"
  }
}
```

### Refund Rules

- ✅ Can only refund **paid** orders
- ✅ Cannot refund already refunded orders
- ✅ Automatically cancels the order
- ✅ Stores refund ID from Stripe
- ✅ Stores refund timestamp
- ✅ Sends notification emails

### What Happens When Order Is Refunded:

1. **Order Status** → 'cancelled'
2. **Refund Status** → 'succeeded' (if Stripe successful)
3. **Refund Amount** → Stored in database
4. **Refund ID** → Stripe refund ID
5. **Refund Reason** → User-provided or default
6. **Refunded At** → Current timestamp
7. **Emails Sent**:
   - User receives refund confirmation
   - Admin receives refund notification

---

## 3. Email Types Summary

### Total: 8 Email Types

| #   | Name              | Trigger              | Sent To | Email Type   |
| --- | ----------------- | -------------------- | ------- | ------------ |
| 1   | Order Created     | User creates order   | User    | Confirmation |
| 2   | Order Created     | User creates order   | Admin   | Alert        |
| 3   | Payment Confirmed | Cron detects payment | User    | Confirmation |
| 4   | Payment Confirmed | Cron detects payment | Admin   | Alert        |
| 5   | Book Uploaded     | Admin uploads book   | User    | Notification |
| 6   | Delivery Updated  | Admin updates status | User    | Update       |
| 7   | Order Refunded    | Refund API called    | User    | Confirmation |
| 8   | Order Refunded    | Refund API called    | Admin   | Alert        |

---

## 4. Database Schema Updates

### Order Model New Fields

```javascript
{
  stripePaymentIntentId: String,  // For refund tracking
  refundId: String,               // Stripe refund ID
  refundStatus: String,           // none | pending | succeeded | failed
  refundAmount: Number,           // Amount refunded (in cents)
  refundReason: String,           // Reason for refund
  refundedAt: Date,              // When refund was processed
  status: String                  // Now includes 'refunded' enum
}
```

---

## 5. Order Status Lifecycle

```
pending → paid → (Book Upload) → delivery process → completed
       ↓
     (Refund API)
       ↓
    cancelled (refunded)
```

### Status Values

- `pending` - Awaiting payment (cron job checks this)
- `paid` - Payment confirmed (updated by cron job)
- `cancelled` - Order refunded/cancelled (updated by refund API)
- `refunded` - Historical status marker

---

## 6. API Endpoints

### Payment Check (Manual)

```
POST /api/orders/check-payment-status
Body: { sessionId, orderId }
```

Manually trigger payment status check for a specific order.

### Refund Order

```
POST /api/orders/refund
Body: { orderId, reason }
```

Initiate refund and cancel the order.

### Existing Endpoints

```
POST /api/orders/calculate-price
POST /api/orders/confirm-payment
GET /api/orders/user/:userId
PATCH /api/orders/update-delivery-status
PUT /api/orders/upload-book
GET /api/orders/admin/all-orders
GET /api/orders/admin/dashboard-stats
```

---

## 7. Cron Job Details

### File

[paymentCheck.cron.js](src/entities/order/paymentCheck.cron.js)

### Functions

- `checkPendingPaymentsJob()` - Checks all pending orders
- `initPaymentCheckCron()` - Starts cron job (called in app.js)
- `stopPaymentCheckCron(intervalId)` - Stops cron job if needed

### Initialization

```javascript
// In app.js
import { initPaymentCheckCron } from './entities/order/paymentCheck.cron.js';

// Called during server startup
initPaymentCheckCron(); // Returns interval ID
```

### Benefits

- ✅ No webhook configuration needed
- ✅ Automatic retry on failure
- ✅ Real-time payment detection (every 5 seconds)
- ✅ Clean logging
- ✅ Non-blocking email notifications
- ✅ Easy to adjust frequency

---

## 8. Configuration

### Environment Variables (.env)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=  # No longer needed (webhook removed)

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Your Company <noreply@company.com>"
ADMIN_MAIL=admin@company.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

**Note:** `STRIPE_WEBHOOK_SECRET` is no longer required!

---

## 9. Files Modified/Created

### Created

- ✅ `paymentCheck.cron.js` - Cron job for payment verification
- ✅ `orderEmail.templates.js` - Added refund email templates

### Updated

- ✅ `order.model.js` - Added refund tracking fields
- ✅ `order.routes.js` - Added refund and check-payment endpoints
- ✅ `order.controller.js` - Added refundOrder and checkPaymentStatus controllers
- ✅ `orderNotification.service.js` - Added refund notification functions
- ✅ `app.js` - Initialize cron job on startup

### Removed

- ❌ `stripe.webhook.js` - Webhook handler deleted (no longer needed)

---

## 10. Testing Checklist

### Cron Job

- [ ] Server starts and cron job initializes
- [ ] Check logs for "Payment Check Cron Job initialized"
- [ ] Verify logs show "⏰ Payment Check Job" every 5 seconds
- [ ] Create a test order and manually mark payment as paid in Stripe
- [ ] Verify cron detects payment change within 5 seconds
- [ ] Check that order status updates to 'paid'
- [ ] Verify payment confirmation emails are sent

### Refund API

- [ ] Call refund endpoint with valid paid order
- [ ] Verify Stripe refund is created
- [ ] Verify order status changes to 'cancelled'
- [ ] Verify order refund fields are populated
- [ ] Verify refund emails are sent (user + admin)
- [ ] Try refund on pending order (should fail)
- [ ] Try refund on already refunded order (should fail)
- [ ] Verify refund timestamp is set correctly

### Email Templates

- [ ] Refund user email renders correctly
- [ ] Refund admin email renders correctly
- [ ] All refund amounts display correctly
- [ ] Refund reason is displayed
- [ ] All other emails still work as expected

---

## 11. Troubleshooting

### Cron Job Not Running

1. Check `app.js` initialization
2. Look for error logs in console
3. Verify MongoDB connection is established before cron starts

### Payments Not Updating

1. Verify `stripeSessionId` exists in order
2. Check Stripe API key is correct
3. Look for console errors in cron job
4. Manually test with `check-payment-status` endpoint

### Refund Failed

1. Verify order is marked as 'paid'
2. Check `stripePaymentIntentId` exists
3. Verify Stripe API permissions
4. Check Stripe test mode vs live mode

### Emails Not Sending

1. Verify email credentials in `.env`
2. Check email logs in console
3. Review spam folder
4. Test with simple email first

---

## 12. Performance Notes

### Cron Job Frequency

- **Current:** Every 5 seconds
- **Can be adjusted:** Change 5000ms to desired interval
- **Impact:** More frequent = quicker detection but more API calls

### Database Queries

- Cron only fetches pending orders (indexed query)
- Stripe API calls are minimal (one per pending order)
- Non-blocking email sends don't impact order processing

---

## 13. Future Enhancements

- [ ] Add webhook support alongside cron (hybrid approach)
- [ ] Implement retry logic for failed refunds
- [ ] Add refund reason templates
- [ ] Send partial refund support
- [ ] Add refund tracking dashboard
- [ ] Implement scheduled refund requests
- [ ] Add customer-initiated refund requests
- [ ] Multi-currency refund support
