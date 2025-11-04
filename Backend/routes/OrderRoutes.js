import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import { createOrder, getUserOrders, getSellerOrders } from '../controllers/OrderController.js';

const router = express.Router();


router.post(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  createOrder
);

router.get(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  getUserOrders
);

router.get(
  '/seller',
  authMiddleware,
  restrictTo('seller'),
  getSellerOrders
);

export default router;