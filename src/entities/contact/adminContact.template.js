export const getContactMessageForAdminTemplate = ({
  firstName,
  lastName,
  email,
  phone,
  message,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>📩 New Contact Message</h2>

      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>

      <hr />

      <p><strong>Message:</strong></p>
      <p>${message}</p>

      <br />
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
  `;
};
