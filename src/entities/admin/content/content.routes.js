import express from 'express';

import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  updateItem,
  createOrUpdateHeader,
  getHeader
} from './content.controller.js';
import { multerUpload } from '../../../core/middlewares/multer.js';

const router = express.Router();

// Upload one image per item
router.post(
  '/upload',
  multerUpload([{ name: 'image', maxCount: 1 }]),
  createItem
);
router.get('/get-header', getHeader);
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.patch(
  '/:id',
  multerUpload([{ name: 'image', maxCount: 1 }]),
  updateItem
);
router.delete('/:id', deleteItem);

// Header routes
router.post('/header', createOrUpdateHeader);


export default router;
