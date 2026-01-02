import sendEmail from '../../lib/sendEmail.js';
import { adminMail } from '../../core/config/config.js';
import { getGuestSubscribeForAdminTemplate } from '../../lib/adminGuestSubscribe.template.js';

export const notifyAdminGuestSubscribed = async ({ email }) => {
  return sendEmail({
    to: adminMail,
    subject: '📩 New Guest Newsletter Subscription',
    html: getGuestSubscribeForAdminTemplate({ email }),
  });
};
