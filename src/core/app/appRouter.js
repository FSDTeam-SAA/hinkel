import express from 'express';
import authRoutes from '../../entities/auth/auth.routes.js';
import userRoutes from '../../entities/user/user.routes.js';
import pricingTierRoutes from '../../entities/admin/pricing.routes.js'
import generateImage from '../../entities/GEMINI/gemini.route.js'
import orderRoutes from '../../entities/order/order.routes.js'

import contentRoutes  from '../../entities/admin/content/content.routes.js'

import guestRouter from '../../entities/newsletter/guest.router.js'
import contactRouter from '../../entities/contact/contact.router.js'

import faqRoutes from "../../entities/faq/faq.route.js";
import faqAdminRoutes from "../../entities/faq/faq.admin.route.js";
import privacyRoutes from "../../entities/privacy/privacy.route.js";
import privacyAdminRoutes from "../../entities/privacy/privacy.admin.route.js";

import staticPageRoutes from "../../entities/staticPage/staticPage.route.js";
import staticPageAdminRoutes from "../../entities/staticPage/staticPage.admin.route.js";



const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/pricing',pricingTierRoutes)
router.use('/v1/ai',generateImage)

router.use('/v1/order',orderRoutes)
router.use('/v1/content',contentRoutes)

router.use('/v1/order',orderRoutes);
router.use('/v1/guest',guestRouter);
router.use('/v1/contact', contactRouter);
router.use("/v1/faqs", faqRoutes);
router.use("/v1/admin/faqs", faqAdminRoutes);

router.use("/v1/privacy", privacyRoutes);
router.use("/v1/admin/privacy", privacyAdminRoutes);


router.use("/v1/pages", staticPageRoutes);
router.use("/v1/admin/pages", staticPageAdminRoutes);

export default router;
