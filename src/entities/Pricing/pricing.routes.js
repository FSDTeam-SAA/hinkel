import express from 'express';
import PricingTierController from './pricing.controller.js';

const router = express.Router();

// ADMIN ROUTES
router.post(
  '/admin/pricing-tiers',
 
  PricingTierController.create
);

router.put(
  '/admin/pricing-tiers/:id',
  
  PricingTierController.update
);

router.delete(
  '/admin/pricing-tiers/:id',
 
  PricingTierController.remove
);

// PUBLIC / SHARED
router.get(
  '/pricing-tiers',
  PricingTierController.getAll
);

router.get(
  '/pricing-tiers/:pageCount',
  PricingTierController.getByPageCount
);

export default router;
