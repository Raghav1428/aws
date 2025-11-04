import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import { 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  getCart, 
  clearCart 
} from '../controllers/CartController.js';

const router = express.Router();


router.post(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  addToCart
);


router.put(
  '/item',
  authMiddleware,
  restrictTo('buyer'),
  updateCartItem
);


router.delete(
  '/item/:productId',
  authMiddleware,
  restrictTo('buyer'),
  removeFromCart
);

router.get(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  getCart
);


router.delete(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  clearCart
);

export default router;