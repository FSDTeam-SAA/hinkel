// ✅ ESM
const verificationCodeTemplate = (code) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your verification code</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8f4ee;font-family:Arial,sans-serif;color:#3f3127;">
      <div style="width:100%;background:radial-gradient(circle at top,#ffe2c6 0%,#f8f4ee 42%,#f8f4ee 100%);padding:32px 16px;">
        <div style="max-width:600px;margin:0 auto;">
          <div style="text-align:center;padding-bottom:18px;">
            <div style="display:inline-block;background-color:#fff2e6;color:#d96d2d;border-radius:18px;padding:10px 16px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
              Account Security
            </div>
          </div>

          <div style="background-color:#ffffff;border:1px solid #f0ddca;border-radius:24px;overflow:hidden;box-shadow:0 18px 55px rgba(163,99,44,0.12);">
            <div style="padding:40px 32px 28px;background:linear-gradient(180deg,#fff8f1 0%,#ffffff 100%);border-bottom:1px solid #f4e4d4;text-align:center;">
              <div style="width:64px;height:64px;line-height:64px;margin:0 auto 18px;background-color:#fff0e1;border-radius:20px;font-size:30px;">
                🔐
              </div>
              <h1 style="margin:0;font-size:30px;line-height:1.2;color:#8f451c;">
                Verify your email
              </h1>
              <p style="margin:14px auto 0;max-width:420px;font-size:16px;line-height:1.7;color:#6f5948;">
                Use the code below to complete your sign up or password reset securely.
              </p>
            </div>

            <div style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#4f3422;">
                Hello,
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#6f5948;">
                Enter this verification code in the app to continue. For your security, the code expires in
                <strong style="color:#8f451c;"> 5 minutes</strong>.
              </p>

              <div style="margin:0 0 24px;border:1px solid #f1dcc7;border-radius:22px;background-color:#fffaf5;padding:16px;text-align:center;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#b47a55;">
                  Verification Code
                </p>
                <div style="display:inline-block;padding:16px 24px;border-radius:18px;background-color:#ffffff;border:1px dashed #f3b689;font-size:34px;line-height:1;letter-spacing:10px;font-weight:700;color:#d96d2d;">
                  ${code}
                </div>
              </div>

              <div style="margin:0 0 24px;border-radius:18px;background-color:#fff3e7;padding:18px 20px;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#7a5b48;">
                  If you didn&apos;t request this code, you can safely ignore this email. No changes will be made unless the code is entered.
                </p>
              </div>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#6f5948;">
                Need help? Reply to this email and our team will be happy to assist.
              </p>
            </div>

            <div style="padding:20px 32px 28px;border-top:1px solid #f4e4d4;text-align:center;background-color:#fffdfa;">
              <p style="margin:0 0 6px;font-size:13px;color:#9b806e;">
                This message was sent automatically for account verification.
              </p>
              <p style="margin:0;font-size:12px;color:#b29b8c;">
                &copy; ${new Date().getFullYear()} Hinkle. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

export default verificationCodeTemplate;

export const getPaymentSuccessTemplate = ({ name, eventId, slots }) => {
  const slotDetails = slots
    .map(
      (slot, index) =>
        `<li><strong>Slot ${index + 1}:</strong> ${slot.date} from ${slot.startTime} to ${slot.endTime}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>✅ Booking Confirmed</h2>
      <p>Dear ${name},</p>
      <p>Your payment has been successfully received and your booking has been confirmed.</p>
      <p><strong>Event ID:</strong> ${eventId}</p>
      <p><strong>Slot(s) Booked:</strong></p>
      <ul>
        ${slotDetails}
      </ul>
      <br />
      <p>Thank you for choosing our service.</p>
      <p>We look forward to seeing you at the event.</p>
      <br />
    
      
    </div>
  `;
};

// auto refunded template

export const getConflictAfterPaymentTemplate = ({
  name,
  email,
  phone,
  eventId,
  eventTitle,
  selectedDate,
  selectedSlots = [],
  sessionId,
  paymentIntentId,
  refundAmount
}) => {
  const slotDetails = selectedSlots
    .map(
      (slot, index) =>
        `<li><strong>Slot ${index + 1}:</strong> ${slot.date} from ${slot.startTime} to ${slot.endTime}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>⚠️ Booking Conflict Detected After Payment</h2>

      <p><strong>Customer Details:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
      </ul>

      <p><strong>Event Details:</strong></p>
      <ul>
        <li><strong>Event ID:</strong> ${eventId}</li>
        <li><strong>Event Title:</strong> ${eventTitle || 'N/A'}</li>
        <li><strong>Date:</strong> ${selectedDate}</li>
      </ul>

      <p><strong>Attempted Slot(s):</strong></p>
      <ul>
        ${slotDetails}
      </ul>

      <p><strong>Stripe Info:</strong></p>
      <ul>
        <li><strong>Session ID:</strong> ${sessionId}</li>
        <li><strong>Payment Intent ID:</strong> ${paymentIntentId}</li>
        ${
          refundAmount
            ? `<li><strong>Refund Amount:</strong> $${(refundAmount / 100).toFixed(2)}</li>`
            : ''
        }
        <li><strong>Refund Status:</strong> Refund automatically processed</li>
      </ul>

      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>

      <br />
      <p style="color: red;">
        ⚠️ Some of the selected slots were already booked by the time payment completed.<br/>
        The booking was not created, and the payment has been refunded.
      </p>
    </div>
  `;
};

export const getPaymentSuccessForAdminTemplate = ({
  name,
  email,
  phone,
  eventId,
  slots
}) => {
  const slotDetails = slots
    .map(
      (slot, index) =>
        `<li><strong>Slot ${index + 1}:</strong> ${slot.date} from ${slot.startTime} to ${slot.endTime}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>📥 New Booking Received</h2>
      <p><strong>User Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Event ID:</strong> ${eventId}</p>
      <p><strong>Slot(s) Booked:</strong></p>
      <ul>
        ${slotDetails}
      </ul>
      <br />
      <p>This booking has been paid and confirmed via Stripe.</p>
      <p>Please make necessary arrangements for the event.</p>
    </div>
  `;
};
