import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import { 
  createCoupon, 
  getActiveCoupons, 
  getAllCoupons, 
  getSellerCoupons, 
  verifyCoupon 
} from '../controllers/CouponController.js';

const router = express.Router();


router.post(
  '/',
  authMiddleware,
  restrictTo('seller'),
  createCoupon
);


router.get(
  '/active',
  getActiveCoupons
);

router.get(
  '/',
  authMiddleware,
  restrictTo('admin'),
  getAllCoupons
);


router.get(
  '/seller/:sellerId',
  authMiddleware,
  restrictTo('admin'),
  getSellerCoupons
);


router.get(
  '/verify/:code',
  authMiddleware,
  verifyCoupon
);

export default router;