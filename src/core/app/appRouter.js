import express from 'express';
import authRoutes from '../../entities/auth/auth.routes.js';
import userRoutes from '../../entities/user/user.routes.js';
import pricingTierRoutes from '../../entities/Pricing/pricing.routes.js'
import generateImage from '../../entities/GEMINI/gemini.route.js'
const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/pricing',pricingTierRoutes)
router.use('/v1/ai',generateImage)


export default router;
