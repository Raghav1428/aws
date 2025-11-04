import Product from '../models/Product.js';
import uploadImageToS3 from '../utils/s3.js';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to handle file uploads
export const uploadProductImages = upload.array('images', 5); // Allow up to 5 images

export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    
    // Use the model's findAll method with filters
    const products = await Product.findAll({
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search
    });
    
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Natural language product search
export const searchProducts = async (req, res) => {
  try {
    const { q, category } = req.query;

    // Parse simple natural language price phrases from q as a first pass
    let minPrice;
    let maxPrice;
    if (q) {
      const text = q.toLowerCase();
      const betweenMatch = text.match(/(?:between|from)\s*(\d+[\d,\.]*)(?:\s*(?:and|to)\s*)(\d+[\d,\.]*)/);
      const underMatch = text.match(/(?:under|below|less than)\s*(\d+[\d,\.]*)/);
      const overMatch = text.match(/(?:over|above|more than|greater than)\s*(\d+[\d,\.]*)/);

      const toNumber = (s) => Number(String(s).replace(/[,]/g, ''));

      if (betweenMatch) {
        minPrice = toNumber(betweenMatch[1]);
        maxPrice = toNumber(betweenMatch[2]);
      } else if (underMatch) {
        maxPrice = toNumber(underMatch[1]);
      } else if (overMatch) {
        minPrice = toNumber(overMatch[1]);
      }
    }

    const products = await Product.search({
      q,
      minPrice,
      maxPrice,
      category,
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Handle image uploads to S3
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // Upload each image to S3 and collect URLs
      const uploadPromises = req.files.map(file => uploadImageToS3(file));
      imageUrls = await Promise.all(uploadPromises);
    }
    
    // Create product with PostgreSQL
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category: Array.isArray(category) ? category : [category],
      sellerId: req.user.id,
      stock: Number(stock),
      imageUrls
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const productId = req.params.id;
    
    // Check if product exists and belongs to the seller
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (existingProduct.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    // Handle image uploads if any
    let imageUrls = undefined;
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImageToS3(file));
      imageUrls = await Promise.all(uploadPromises);
    }
    
    // Update product
    const updatedProduct = await Product.update(productId, {
      name,
      description,
      price: price ? Number(price) : undefined,
      category: category ? (Array.isArray(category) ? category : [category]) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      imageUrls
    });
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists and belongs to the seller
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (existingProduct.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    
    // Delete product
    await Product.delete(productId);
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};