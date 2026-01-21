import nodemailer from 'nodemailer';
import {
  emailHost,
  emailPort,
  emailAddress,
  emailPass,
  emailFrom
} from '../core/config/config.js';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort == 465, // true for port 465 (SSL), false for port 587 (TLS)
      auth: {
        user: emailAddress,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('Email service ready:', emailAddress);

    const mailOptions = {
      from: emailFrom,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      'Email sent successfully to:',
      to,
      'Message ID:',
      result.messageId
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    console.error('Error details:', error);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
