export const getGuestSubscribeForAdminTemplate = ({ email }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>📩 New Guest Subscription</h2>

      <p>A new guest has subscribed to the newsletter.</p>

      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>

      <br />
      <p>Please review the subscriber list in the admin panel.</p>
    </div>
  `;
};
