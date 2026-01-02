import { catchAsync } from "../../utility/catchAsync.js";
import { guestService } from "./guest.service.js";
import { sendResponse } from "../../utility/sendResponse.js";

const guestSubscriber = catchAsync(async (req, res) => {
  const guest = await guestService.createGuestSubscriberIntoDb(req.body.email);

  sendResponse(res, {
    statusCode: 201,
    message: 'Subscribed successfully',
    data: guest,
  });
});


export const guestController = {
    guestSubscriber
}
