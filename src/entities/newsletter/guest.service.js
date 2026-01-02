
import { AppError } from "../../utility/AppError.js";
import { Guest } from "./guest.model.js";
// import  sendEmail from "../../lib/sendEmail.js";

import { notifyAdminGuestSubscribed } from "./guestNotification.service.js";

// const createGuestSubscriberIntoDb = async(email) => {
//     const isExistEmail = await Guest.findOne({email});

//     if (!email) {
//     throw new AppError('Email is required', 400);
//   }

//   if (isExistEmail) {
//   throw new AppError('Email already exists', 409, [
//     {
//       field: 'email',
//       message: 'This email is already subscribed',
//     },
//   ]);
// }


//     const guest = await Guest.create({email});
//     return guest;

   


// }

const createGuestSubscriberIntoDb = async (email) => {
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const isExistEmail = await Guest.findOne({ email });
  if (isExistEmail) {
    throw new AppError('Email already exists', 409, [
      { field: 'email', message: 'This email is already subscribed' },
    ]);
  }

  const guest = await Guest.create({ email });

  // 🔔 Notify admin (side effect)
  notifyAdminGuestSubscribed({ email }).catch((err) => {
    console.error('Admin email notification failed:', err);
  });

  return guest;
};

export const guestService = {
    createGuestSubscriberIntoDb
}