import express from 'express'
import { getAllPrices, setPrice } from './pricing.controller.js';
const router = express.Router();




// Admin sets the price per page
// Example Body: { "deliveryType": "print", "pricePerPage": 5.50 }
router.post('/admin/set-price', setPrice);

// Public/User gets the prices to display on the calculation page
router.get('/admin/get-prices', getAllPrices);

export default router