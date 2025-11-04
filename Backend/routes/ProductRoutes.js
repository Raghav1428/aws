import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadProductImages, searchProducts } from '../controllers/ProductController.js';

const router = express.Router();

// Get all products with optional filtering
router.get('/getallproducts', getProducts);

// Full-text/NLP search
router.get('/search', searchProducts);

// Get product by ID
router.get('/:id', getProductById);

// Create product with image upload
router.post(
  '/create',
  authMiddleware,
  restrictTo('seller'),
  uploadProductImages, // Multer middleware for handling file uploads
  createProduct
);

// Update product with optional image upload
router.put(
  '/update/:id',
  authMiddleware,
  restrictTo('seller'),
  uploadProductImages, // Multer middleware for handling file uploads
  updateProduct
);

// Delete product
router.delete(
  '/delete/:id',
  authMiddleware,
  restrictTo('seller'),
  deleteProduct
);

export default router;