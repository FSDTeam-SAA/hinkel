import express from 'express';

import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  getItemBySlug,
  updateItem,
  createOrUpdateHeader,
  getHeader,
  getDistinctTypes
} from './content.controller.js';
import { multerUpload } from '../../../core/middlewares/multer.js';

const router = express.Router();

// Get all distinct types - must be before /:id route
router.get('/types/list', getDistinctTypes);
router.get('/slug/:slug', getItemBySlug);

// Upload one image per item
router.post(
  '/upload',
  multerUpload([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  createItem
);
router.get('/get-header', getHeader);
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.patch(
  '/:id',
  multerUpload([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  updateItem
);
router.delete('/:id', deleteItem);

// Header routes
router.post('/header', createOrUpdateHeader);

export default router;
