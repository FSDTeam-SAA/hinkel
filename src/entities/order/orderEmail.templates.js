/**
 * Email template for user when order is created (pending payment)
 */
export const getOrderCreatedUserTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">🛒 Order Created Successfully</h2>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Your order has been created and is pending payment confirmation.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #495057;">Order Details</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p><strong>Total Amount:</strong> $${amount} USD</p>
        <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">${orderData.status}</span></p>
      </div>
      
      <p>Please complete the payment to process your order.</p>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Created:</strong> ${new Date(orderData.createdAt).toLocaleString()}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      
      <p style="color: #999; font-size: 12px;">
        If you have any questions, please contact our support team.
      </p>
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
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #28a745;">✅ Payment Confirmed!</h2>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Thank you for your payment! Your order is now being processed.</p>
      
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3 style="margin-top: 0; color: #155724;">Order Details</h3>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p><strong>Amount Paid:</strong> $${amount} USD</p>
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${orderData.status}</span></p>
        ${orderData.title ? `<p><strong>Title:</strong> ${orderData.title}</p>` : ''}
      </div>
      
      <p>We will notify you once your book is ready for delivery.</p>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Payment Confirmed:</strong> ${new Date().toLocaleString()}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      
      <p style="color: #999; font-size: 12px;">
        Thank you for your business! If you have any questions, please contact our support team.
      </p>
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
 * Email template for user when book is uploaded
 */
export const getBookUploadedUserTemplate = (orderData, userData) => {
  const amount = (orderData.totalAmount / 100).toFixed(2);
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #007bff;">📚 Your Book is Ready!</h2>
      
      <p>Hi <strong>${userData.firstName || userData.name || 'Customer'}</strong>,</p>
      
      <p>Great news! Your book has been uploaded and is ready for you.</p>
      
      <div style="background-color: #cfe2ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
        <h3 style="margin-top: 0; color: #084298;">Book Details</h3>
        <p><strong>Title:</strong> ${orderData.title}</p>
        <p><strong>Order ID:</strong> ${orderData._id}</p>
        <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
        <p><strong>Page Count:</strong> ${orderData.pageCount} pages</p>
        <p><strong>Approval Status:</strong> <span style="color: #007bff; font-weight: bold;">${orderData.approvalStatus || 'Approved'}</span></p>
      </div>
      
      ${
        orderData.book
          ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${orderData.book}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          📥 Download Your Book
        </a>
      </div>
      `
          : ''
      }
      
      <p>You can now access your book using the link above.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Delivery Status:</strong> ${orderData.deliveryStatus}</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Uploaded:</strong> ${new Date().toLocaleString()}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      
      <p style="color: #999; font-size: 12px;">
        Thank you for choosing our service! If you have any questions, please contact our support team.
      </p>
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
      
      ${
        orderData.book
          ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${orderData.book}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          📥 Access Your Book
        </a>
      </div>
      `
          : ''
      }
      
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
