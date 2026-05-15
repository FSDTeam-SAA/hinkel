/**
 * Email template for user when order is created (pending payment)
 */
export const getOrderCreatedUserTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  const deliveryInfo = orderData.deliveryType === 'digital' 
    ? 'Your digital coloring book will be delivered to your email as a PDF attachment once you finalize your creation.'
    : orderData.deliveryType === 'print'
    ? 'Your physical coloring book will be printed and shipped to your address once you finalize your creation.'
    : 'You will receive a digital PDF via email and a physical copy will be shipped to your address once you finalize your creation.';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #ff8b36; margin-bottom: 5px;">🛒 Order Received!</h2>
        <p style="color: #666; font-size: 16px;">We've received your order and it's pending payment.</p>
      </div>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Thank you for starting your journey with Hinkle Creek! Your order has been successfully created and is waiting for payment confirmation to proceed.</p>
      
      <div style="background-color: #fffaf3; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #ffe8d6;">
        <h3 style="margin-top: 0; color: #ff8b36; border-bottom: 1px solid #ffe8d6; padding-bottom: 10px;">Order Summary</h3>
        <p style="margin: 10px 0;"><strong>Order ID:</strong> <span style="font-family: monospace;">${orderData._id}</span></p>
        <p style="margin: 10px 0;"><strong>Delivery Method:</strong> ${orderData.deliveryType.replace('&', ' & ')}</p>
        <p style="margin: 10px 0;"><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p style="margin: 10px 0;"><strong>Total Amount:</strong> $${amount} USD</p>
        <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold; text-transform: uppercase;">${orderData.status}</span></p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ff8b36; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>Next Steps:</strong> ${deliveryInfo}
        </p>
      </div>
      
      <p>Please complete your payment to continue building your custom coloring book.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
        <p>Created on ${new Date(orderData.createdAt).toLocaleString()}</p>
        <p>&copy; ${new Date().getFullYear()} Hinkle Creek. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Email template for admin when new order is created
 */
export const getOrderCreatedAdminTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🆕 New Order Created</h2>
      
      <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Information</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p><strong>Total Amount:</strong> $${amount} USD</p>
        <p><strong>Status:</strong> ${orderData.status}</p>
        <p><strong>Stripe Session ID:</strong> ${orderData.stripeSessionId || 'N/A'}</p>
      </div>
      
      <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
        <h3 style="margin-top: 0;">Customer Information</h3>
        <p><strong>User ID:</strong> ${userData._id}</p>
        <p><strong>Name:</strong> ${userData.firstName || userData.name || 'N/A'} ${userData.lastName || ''}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
      </div>
      
      <p><strong>Time:</strong> ${new Date(orderData.createdAt).toLocaleString()}</p>
      
      <p style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
        ⚠️ Order is pending payment confirmation from Stripe.
      </p>
    </div>
  `;
};

/**
 * Email template for user when payment is confirmed
 */
export const getPaymentConfirmedUserTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  const deliveryAction = orderData.deliveryType === 'digital'
    ? 'Once you finish customizing your book and click "Finalize", your PDF will be sent directly to this email address.'
    : orderData.deliveryType === 'print'
    ? 'Once you finalize your book, we will start the printing process and notify you when it ships.'
    : 'Once you finalize your book, your PDF copy will be sent to your email and your physical copy will be prepared for shipping.';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #d4edda; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
          <span style="color: #28a745; font-size: 30px;">✓</span>
        </div>
        <h2 style="color: #28a745; margin: 0;">Payment Confirmed!</h2>
        <p style="color: #666; font-size: 16px;">Your order is now being processed.</p>
      </div>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Success! We've received your payment and your order is officially confirmed. You can now proceed to complete your custom coloring book.</p>
      
      <div style="background-color: #f0fff4; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #c3e6cb;">
        <h3 style="margin-top: 0; color: #155724; border-bottom: 1px solid #c3e6cb; padding-bottom: 10px;">Payment Details</h3>
        <p style="margin: 10px 0;"><strong>Order ID:</strong> <span style="font-family: monospace;">${orderData._id}</span></p>
        <p style="margin: 10px 0;"><strong>Delivery Type:</strong> ${orderData.deliveryType.replace('&', ' & ')}</p>
        <p style="margin: 10px 0;"><strong>Amount Paid:</strong> $${amount} USD</p>
        <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold; text-transform: uppercase;">PAID</span></p>
        ${orderData.title ? `<p style="margin: 10px 0;"><strong>Book Title:</strong> ${orderData.title}</p>` : ''}
      </div>
      
      <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #004085;">
          <strong>What's Next?</strong> ${deliveryAction}
        </p>
      </div>
      
      <p>Thank you for your business! If you have any questions, our team is here to help.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
        <p>Confirmed on ${new Date().toLocaleString()}</p>
        <p>&copy; ${new Date().getFullYear()} Hinkle Creek. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Email template for admin when payment is confirmed
 */
export const getPaymentConfirmedAdminTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>💰 Payment Confirmed</h2>
      
      <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #155724;">Payment Successful</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Amount Received:</strong> $${amount} USD</p>
        <p><strong>Status:</strong> ${orderData.status}</p>
        <p><strong>Stripe Session ID:</strong> ${orderData.stripeSessionId || 'N/A'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p><strong>Delivery Status:</strong> ${orderData.deliveryStatus}</p>
        ${orderData.title ? `<p><strong>Title:</strong> ${orderData.title}</p>` : ''}
      </div>
      
      <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
        <h3 style="margin-top: 0;">Customer Information</h3>
        <p><strong>User ID:</strong> ${userData._id}</p>
        <p><strong>Name:</strong> ${userData.firstName || userData.name || 'N/A'} ${userData.lastName || ''}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
      </div>
      
      <p><strong>Payment Time:</strong> ${new Date().toLocaleString()}</p>
      
      <p style="margin-top: 20px; padding: 10px; background-color: #fff3cd; border-radius: 5px;">
        ⚡ Action Required: Please process this order and upload the book.
      </p>
    </div>
  `;
};

/**
 * Email template for user when the finalized book is created and waiting for admin review
 */
export const getBookPendingReviewUserTemplate = (orderData, userData) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🕒</div>
        <h2 style="color: #ff8b36; margin: 0;">Your Book Was Created Successfully</h2>
      </div>

      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>

      <p>Your custom coloring book has been successfully created and is now waiting for admin verification.</p>

      <div style="background-color: #fffaf3; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #ffe8d6;">
        <h3 style="margin-top: 0; color: #ff8b36; border-bottom: 1px solid #ffe8d6; padding-bottom: 10px;">Book Details</h3>
        <p style="margin: 10px 0;"><strong>Title:</strong> ${orderData.title}</p>
        <p style="margin: 10px 0;"><strong>Order ID:</strong> <span style="font-family: monospace;">${orderData._id}</span></p>
        <p style="margin: 10px 0;"><strong>Delivery Type:</strong> ${orderData.deliveryType.replace('&', ' & ')}</p>
        <p style="margin: 10px 0;"><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p style="margin: 10px 0;"><strong>Review Status:</strong> <span style="color: #ff8b36; font-weight: bold; text-transform: capitalize;">${orderData.deliveryStatus || 'pending'}</span></p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ff8b36; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>What happens next?</strong> Our team will review your book and email you once it has been approved or if anything needs attention.
        </p>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
        <p>Created on ${new Date().toLocaleString()}</p>
        <p>&copy; ${new Date().getFullYear()} Hinkle Creek. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Email template for user when book is approved
 */
export const getBookApprovedUserTemplate = (orderData, userData) => {
  const { deliveryType } = orderData;
  
  let headerText = 'Your Book is Ready!';
  let mainMessage = 'Great news! Your custom coloring book has been finalized and is ready for you.';
  let subMessage = 'We will follow up with any next steps you need.';
  let icon = '📚';

  if (deliveryType === 'print') {
    headerText = 'Print Order Confirmed!';
    mainMessage = 'Your physical coloring book order has been finalized and sent to our printing facility.';
    subMessage = 'We will notify you with a tracking number once your book has been shipped.';
    icon = '📦';
  } else if (deliveryType === 'print&digital') {
    headerText = 'Print Order Confirmed & Digital Book Ready!';
    mainMessage = 'Your physical book is being prepared for printing, and your digital copy is attached to this email.';
    subMessage = 'We will notify you when your physical copy ships.';
    icon = '✨';
  } else if (deliveryType === 'digital') {
    headerText = 'Digital Book Delivered!';
    mainMessage = 'Your custom digital coloring book is attached to this email.';
    subMessage = 'Please keep this email for future reference.';
    icon = '📥';
  }

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 40px; margin-bottom: 10px;">${icon}</div>
        <h2 style="color: #007bff; margin: 0;">${headerText}</h2>
      </div>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>${mainMessage}</p>
      
      <div style="background-color: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #b8daff;">
        <h3 style="margin-top: 0; color: #004085; border-bottom: 1px solid #b8daff; padding-bottom: 10px;">Book Details</h3>
        <p style="margin: 10px 0;"><strong>Title:</strong> ${orderData.title}</p>
        <p style="margin: 10px 0;"><strong>Order ID:</strong> <span style="font-family: monospace;">${orderData._id}</span></p>
        <p style="margin: 10px 0;"><strong>Delivery Type:</strong> ${orderData.deliveryType.replace('&', ' & ')}</p>
        <p style="margin: 10px 0;"><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.5; color: #555;">${subMessage}</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;"><strong>Delivery Status:</strong> <span style="text-transform: capitalize; color: #007bff; font-weight: bold;">${orderData.deliveryStatus || 'Processing'}</span></p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
        <p>Delivered on ${new Date().toLocaleString()}</p>
        <p>&copy; ${new Date().getFullYear()} Hinkle Creek. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Email template for user when book is rejected
 */
export const getBookRejectedUserTemplate = (orderData, userData) => {
  const refundAmount = orderData.refundAmount
    ? (orderData.refundAmount / 100).toFixed(2)
    : null;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #d9534f;">Book Review Update</h2>

      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>

      <p>We’re sorry, but your book could not be approved by our review team.</p>

      <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d9534f;">
        <h3 style="margin-top: 0; color: #c9302c;">Review Outcome</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        ${orderData.title ? `<p><strong>Book Title:</strong> ${orderData.title}</p>` : ''}
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType.replace('&', ' & ')}</p>
        <p><strong>Status:</strong> <span style="color: #d9534f; font-weight: bold; text-transform: capitalize;">${orderData.deliveryStatus || 'rejected'}</span></p>
        ${
          orderData.refundReason
            ? `<p><strong>Reason:</strong> ${orderData.refundReason}</p>`
            : ''
        }
      </div>

      ${
        refundAmount
          ? `
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Refund:</strong> A refund of $${refundAmount} USD has been initiated for this order. Please allow 5-7 business days for the funds to appear in your account.</p>
      </div>
      `
          : ''
      }

      <p>If you have any questions or would like help creating a revised version, please reply to this email and our team will help you.</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
        <p>Updated on ${new Date().toLocaleString()}</p>
        <p>&copy; ${new Date().getFullYear()} Hinkle Creek. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Email template for user when delivery status is updated
 */
export const getDeliveryStatusUpdateUserTemplate = (
  orderData,
  userData,
  oldStatus,
  newStatus
) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);

  // Status color mapping
  const statusColors = {
    pending: '#ff9800',
    processing: '#2196f3',
    shipped: '#9c27b0',
    delivered: '#4caf50',
    cancelled: '#f44336'
  };

  const statusColor = statusColors[newStatus?.toLowerCase()] || '#666';

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: ${statusColor};">📦 Delivery Status Updated</h2>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Your order delivery status has been updated.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #495057;">Status Change</h3>
        <p>
          <span style="color: #999; text-decoration: line-through;">${oldStatus}</span>
          →
          <span style="color: ${statusColor}; font-weight: bold; font-size: 18px;">${newStatus}</span>
        </p>
      </div>
      
      <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #495057;">Order Details</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        ${orderData.title ? `<p><strong>Title:</strong> ${orderData.title}</p>` : ''}
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Updated:</strong> ${new Date().toLocaleString()}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      
      <p style="color: #999; font-size: 12px;">
        Thank you for your patience! If you have any questions, please contact our support team.
      </p>
    </div>
  `;
};

/**
 * Email template for user when refund is processed
 */
export const getRefundUserTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  const refundAmount = orderData.refundAmount
    ? (orderData.refundAmount / 100).toFixed(2)
    : amount;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #d9534f;">💵 Refund Processed</h2>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Your refund has been successfully processed and your order has been cancelled.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d9534f;">
        <h3 style="margin-top: 0; color: #c9302c;">Refund Details</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Refund Amount:</strong> $${refundAmount} USD</p>
        <p><strong>Reason:</strong> ${orderData.refundReason || 'User requested refund'}</p>
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${orderData.refundStatus}</span></p>
        ${orderData.refundId ? `<p><strong>Refund ID:</strong> ${orderData.refundId}</p>` : ''}
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>⏱️ Processing Time:</strong> Refunds typically appear in your account within 5-7 business days.</p>
      </div>
      
      <p><strong>Order Status:</strong> <span style="color: #d9534f; font-weight: bold;">${orderData.status}</span></p>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Refunded:</strong> ${new Date(orderData.refundedAt).toLocaleString()}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      
      <p style="color: #999; font-size: 12px;">
        If you have any questions about this refund, please contact our support team.
      </p>
    </div>
  `;
};

/**
 * Email template for admin when refund is processed
 */
export const getRefundAdminTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  const refundAmount = orderData.refundAmount
    ? (orderData.refundAmount / 100).toFixed(2)
    : amount;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>💵 Order Refunded and Cancelled</h2>
      
      <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #721c24;">Refund Processed</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Original Amount:</strong> $${amount} USD</p>
        <p><strong>Refund Amount:</strong> $${refundAmount} USD</p>
        <p><strong>Refund Status:</strong> ${orderData.refundStatus}</p>
        ${orderData.refundId ? `<p><strong>Stripe Refund ID:</strong> ${orderData.refundId}</p>` : ''}
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p><strong>Order Status:</strong> ${orderData.status}</p>
      </div>
      
      <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
        <h3 style="margin-top: 0;">Customer Information</h3>
        <p><strong>User ID:</strong> ${userData._id}</p>
        <p><strong>Name:</strong> ${userData.firstName || userData.name || 'N/A'} ${userData.lastName || ''}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Reason:</strong> ${orderData.refundReason || 'No reason provided'}</p>
      </div>
      
      <p><strong>Refund Time:</strong> ${new Date(orderData.refundedAt).toLocaleString()}</p>
      
      <p style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
        ℹ️ Order has been automatically cancelled. No further action needed.
      </p>
    </div>
  `;
};
