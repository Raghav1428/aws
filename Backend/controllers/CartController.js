import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import axios from 'axios';

const sendWebhook = async (eventData) => {
  if (!process.env.WEBHOOK_URL) {
    console.warn('WEBHOOK_URL not set in environment variables');
    return;
  }

  try {
    await axios.post(process.env.WEBHOOK_URL, eventData, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`Webhook sent: ${eventData.event}`);
  } catch (error) {
    console.error(`Webhook error for ${eventData.event}:`, error.message);
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // PostgreSQL uses numeric IDs
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid product ID and quantity (min 1) are required' });
    }

    // Check if product exists and has sufficient stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${productId}` });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Find or create cart
    let cart = await Cart.findByUserId(userId);
    if (!cart) {
      cart = await Cart.create(userId);
    }

    // Add item to cart
    const updatedCart = await Cart.addItem(cart.id, productId, quantity);

    // Send webhook
    await sendWebhook({
      event: 'cart_updated',
      userId: String(userId),
      cartId: String(cart.id),
      action: 'item_added',
      productId: String(productId),
      quantity,
      timestamp: Date.now(),
    });

    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: updatedCart
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid product ID and quantity (min 1) are required' });
    }

    const cart = await Cart.findByUserId(userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${productId}` });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Quantity exceeds available stock' });
    }

    const updatedCart = await Cart.updateItem(cart.id, productId, quantity);

    await sendWebhook({
      event: 'cart_updated',
      userId: String(userId),
      cartId: String(cart.id),
      action: 'quantity_updated',
      productId: String(productId),
      quantity,
      timestamp: Date.now(),
    });

    res.status(200).json({
      message: 'Cart item updated successfully',
      cart: updatedCart,
    });

  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findByUserId(userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const updatedCart = await Cart.removeItem(cart.id, Number(productId));

    await sendWebhook({
      event: 'cart_updated',
      userId: String(userId),
      cartId: String(cart.id),
      action: 'item_removed',
      productId: String(productId),
      timestamp: Date.now(),
    });

    res.status(200).json({
      message: 'Item removed from cart successfully',
      cart: updatedCart,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findByUserId(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({
        message: 'Cart is empty',
        cart: { id: null, items: [], totalPrice: 0, remainingBalance: 0 },
      });
    }

    const user = await User.findByIdWithoutPassword(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Cart retrieved successfully',
      cart: {
        id: cart.id,
        items: cart.items.map(item => ({
          product: { id: item.product_id, name: item.name, price: item.price, stock: item.stock },
          quantity: item.quantity,
        })),
        totalPrice: cart.total_price,
        remainingBalance: user.account_balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findByUserId(userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await Cart.clearCart(cart.id);

    await sendWebhook({
      event: 'cart_cleared',
      userId: String(userId),
      cartId: String(cart.id),
      timestamp: Date.now(),
    });

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};
