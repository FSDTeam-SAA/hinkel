import express from 'express';
import { contactController } from './contact.controller.js';
import { contactValidation } from './contact.validation.js';
import { validateRequest } from '../../core/middlewares/validateRequest.js';

const router = express.Router();

router.post('/submit', validateRequest(contactValidation.contactSchema) ,contactController.submitContactForm);

const contactRouter = router;
export default contactRouter;
