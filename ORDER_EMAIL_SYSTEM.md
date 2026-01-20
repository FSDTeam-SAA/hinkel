# Order Email Communication System

## Overview

This document outlines the complete email communication flow between users and admin for the order management system.

## Email Types Summary

### **Total: 6 Email Types**

---

## 1. Order Created (User) ✉️

**Trigger:** When user creates an order (pending payment)  
**Sent to:** User  
**Subject:** 🛒 Order Created - Pending Payment  
**Template:** `getOrderCreatedUserTemplate()`  
**Content:**

- Order ID
- Delivery type
- Page count
- Total amount
- Payment pending notice
- Creation timestamp

**When:** Called in `orderService.createOrderInDb()` → triggered by `confirmPayment` controller

---

## 2. Order Created (Admin) ✉️

**Trigger:** When user creates an order (pending payment)  
**Sent to:** Admin  
**Subject:** 🆕 New Order Created  
**Template:** `getOrderCreatedAdminTemplate()`  
**Content:**

- Order details (ID, delivery type, pages, amount)
- Stripe session ID
- Customer information (name, email, phone)
- Pending payment alert
- Creation timestamp

**When:** Called in `orderService.createOrderInDb()` → triggered by `confirmPayment` controller

---

## 3. Payment Confirmed (User) ✅

**Trigger:** When Stripe payment is successful  
**Sent to:** User  
**Subject:** ✅ Payment Confirmed - Order Processing  
**Template:** `getPaymentConfirmedUserTemplate()`  
**Content:**

- Order ID
- Delivery type
- Page count
- Amount paid
- Order status (paid)
- Title (if available)
- Next steps information

**When:** Called in `orderService.markOrderAsPaid()` → triggered by Stripe webhook `checkout.session.completed`

---

## 4. Payment Confirmed (Admin) 💰

**Trigger:** When Stripe payment is successful  
**Sent to:** Admin  
**Subject:** 💰 Payment Received for Order  
**Template:** `getPaymentConfirmedAdminTemplate()`  
**Content:**

- Payment amount received
- Order details (ID, delivery type, pages)
- Stripe session ID
- Customer information
- Action required: Process order and upload book
- Payment timestamp

**When:** Called in `orderService.markOrderAsPaid()` → triggered by Stripe webhook `checkout.session.completed`

---

## 5. Book Uploaded (User) 📚

**Trigger:** When admin uploads the book file  
**Sent to:** User  
**Subject:** 📚 Your Book is Ready!  
**Template:** `getBookUploadedUserTemplate()`  
**Content:**

- Book title
- Order ID
- Delivery type
- Page count
- Approval status
- Download link (if digital)
- Delivery status
- Upload timestamp

**When:** Called in `orderService.updateOrderWithBook()` → triggered by `uploadBook` controller

---

## 6. Delivery Status Updated (User) 📦

**Trigger:** When admin updates the delivery status  
**Sent to:** User  
**Subject:** 📦 Delivery Status Updated: {newStatus}  
**Template:** `getDeliveryStatusUpdateUserTemplate()`  
**Content:**

- Status change (old → new)
- Order ID
- Book title (if available)
- Delivery type
- Page count
- Book access link (if available)
- Update timestamp

**When:** Called in `orderService.updateOrderDeliveryStatus()` → triggered by `updateDeliveryStatus` controller

---

## Email Flow Diagram

```
User Action                     Email Notification
───────────                     ──────────────────

1. Create Order & Checkout
   ↓
   POST /confirm-payment
   ↓
   Order Created               → Email #1: User (Order Created)
                              → Email #2: Admin (New Order)

2. Complete Payment (Stripe)
   ↓
   Stripe Webhook
   ↓
   Payment Confirmed           → Email #3: User (Payment Confirmed)
                              → Email #4: Admin (Payment Received)

3. Admin Uploads Book
   ↓
   PUT /upload-book
   ↓
   Book Uploaded               → Email #5: User (Book Ready)

4. Admin Updates Delivery
   ↓
   PATCH /update-delivery-status
   ↓
   Delivery Status Changed     → Email #6: User (Status Update)
```

---

## Implementation Files

### Core Files Created/Updated:

1. **orderNotification.service.js** - Email notification functions
2. **orderEmail.templates.js** - HTML email templates
3. **order.service.js** - Business logic with email integration
4. **order.controller.js** - Updated to use service layer
5. **order.routes.js** - Added webhook route
6. **stripe.webhook.js** - Stripe webhook handler

### Integration Points:

- `confirmPayment` → Creates order → Emails #1 & #2
- Stripe Webhook → Marks paid → Emails #3 & #4
- `uploadBook` → Updates order → Email #5
- `updateDeliveryStatus` → Updates status → Email #6

---

## Configuration Required

### Environment Variables (.env):

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Your Company <noreply@company.com>"
ADMIN_MAIL=admin@company.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URLs
FRONTEND_URL=http://localhost:3000
```

### Stripe Webhook Setup:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/orders/webhook`
3. Select events: `checkout.session.completed`, `checkout.session.expired`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Testing Checklist

- [ ] Test order creation emails (user + admin)
- [ ] Test payment confirmation via Stripe test mode
- [ ] Test webhook receiving payment events
- [ ] Test book upload notification
- [ ] Test delivery status update notification
- [ ] Verify all email templates render correctly
- [ ] Check email delivery in spam folder
- [ ] Verify admin receives all notifications
- [ ] Test error handling (email failures should not break flow)

---

## Email Best Practices

1. **Non-blocking**: All emails are sent asynchronously using `.catch()` to prevent blocking the main flow
2. **Error Logging**: Failed emails are logged but don't fail the request
3. **User Privacy**: Only necessary information is included
4. **Admin Actionable**: Admin emails include clear action items
5. **Professional Design**: HTML templates with proper styling
6. **Mobile Responsive**: Email templates work on mobile devices

---

## Troubleshooting

### Emails not sending:

1. Check EMAIL\_\* environment variables
2. Verify SMTP credentials
3. Check app password (Gmail requires app-specific passwords)
4. Review console logs for email errors
5. Check spam folder

### Webhook not receiving events:

1. Verify STRIPE_WEBHOOK_SECRET is set
2. Check webhook endpoint is publicly accessible
3. Review Stripe Dashboard → Webhooks → Recent Events
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/orders/webhook`

---

## Future Enhancements

- [ ] Add order cancellation email
- [ ] Add reminder emails for pending payments
- [ ] Add customer satisfaction survey after delivery
- [ ] Implement email templates with branded design
- [ ] Add SMS notifications for critical updates
- [ ] Multi-language support for emails
- [ ] Email tracking and analytics
