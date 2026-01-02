import { catchAsync } from '../../utility/catchAsync.js';
import { sendResponse } from '../../utility/sendResponse.js';
import { contactService } from './contact.service.js';

const submitContactForm = catchAsync(async (req, res) => {
  const contact = await contactService.createContactMessageIntoDb(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'Message sent successfully',
    data: contact,
  });
});

export const contactController = {
  submitContactForm,
};
