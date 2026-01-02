import express from 'express';
import { validateRequest } from '../../core/middlewares/validateRequest.js';
import { guestController } from './guest.controller.js';
import { guestValidation } from './guest.validation.js';

const router = express.Router();

router.post('/subscribe', validateRequest(guestValidation.guestSubscribeSchema), guestController.guestSubscriber);

const guestRouter = router;
export default guestRouter;