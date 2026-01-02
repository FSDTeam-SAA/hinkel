import Joi from 'joi';

export const guestValidation = {
  guestSubscribeSchema: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim()
  })
};
