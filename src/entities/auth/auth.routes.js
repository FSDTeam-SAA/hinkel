import express from 'express';
import {
  loginUser,
  refreshAccessToken,
  forgetPassword,
  verifyCode,
  resetPassword,
  changePassword,
  logoutUser,
  registerUser,
  verifyEmail,
  resendVerificationEmail
} from './auth.controller.js';
import { verifyToken } from '../../core/middlewares/authMiddleware.js';
import { emailVerificationLimiter } from '../../lib/limit.js';


const router = express.Router();


router.post('/register', registerUser);
router.post('/verify-email', emailVerificationLimiter, verifyEmail);
router.post(
  '/resend-verification-email',
  emailVerificationLimiter,
  resendVerificationEmail,
);
router.post('/login', loginUser);
router.post('/refresh-access-token', refreshAccessToken);
router.post('/forget-password', forgetPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyToken, changePassword);
router.post('/logout', verifyToken, logoutUser);


export default router;
