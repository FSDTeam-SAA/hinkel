import express from 'express';
import { multerUpload } from '../../core/middlewares/multer.js';
import {
  createCmsContent,
  getAllCmsContent,
  getCmsContentBySlug,
  getCmsContentByType,
  getCmsContentById,
  updateCmsContentById,
  deleteCmsContentById,
  getDistinctTypes,
  updateCmsOrder
} from './cms.controller.js';

const router = express.Router();

// Get all distinct types - must be before /:id route
router.get('/types/list', getDistinctTypes);

// Bulk update order
router.patch('/order/bulk', updateCmsOrder);

// Get content by type - must be before /:id route
router.get('/type/:type', getCmsContentByType);
router.get('/slug/:slug', getCmsContentBySlug);

// Create new CMS content
router.post(
  '/',
  multerUpload([{ name: 'image', maxCount: 10 }]),
  createCmsContent
);

// Get all CMS content
router.get('/', getAllCmsContent);

// Get CMS content by ID
router.get('/:id', getCmsContentById);

// Update CMS content by ID
router.patch(
  '/:id',
  multerUpload([{ name: 'image', maxCount: 1 }]),
  updateCmsContentById
);

// Delete CMS content by ID
router.delete('/:id', deleteCmsContentById);

export default router;
