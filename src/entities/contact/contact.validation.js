import Joi from 'joi';

const contactSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  message: Joi.string().trim().min(10).max(1000).required(),
});

export const contactValidation = {
  contactSchema,
};
