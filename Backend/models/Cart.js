import { pool } from '../config/db.js';

const Cart = {
  // Find cart by user ID
  async findByUserId(userId) {
    try {
      // First get the cart
      const cartResult = await pool.query(
        'SELECT * FROM carts WHERE user_id = $1',
        [userId]
      );
      
      if (cartResult.rows.length === 0) {
        return null;
      }
      
      const cart = cartResult.rows[0];
      
      // Then get cart items with product details
      const itemsResult = await pool.query(
        `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.stock, p.seller_id 
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = $1`,
        [cart.id]
      );
      
      return {
        ...cart,
        items: itemsResult.rows
      };
    } catch (error) {
      console.error('Error finding cart:', error);
      throw error;
    }
  },
  
  // Create a new cart
  async create(userId) {
    try {
      const result = await pool.query(
        'INSERT INTO carts (user_id, total_price) VALUES ($1, 0) RETURNING *',
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  },
  
  // Add item to cart
  async addItem(cartId, productId, quantity) {
    try {
      // Check if item already exists in cart
      const existingItem = await pool.query(
        'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cartId, productId]
      );
      
      if (existingItem.rows.length > 0) {
        // Update quantity if item exists
        const newQuantity = existingItem.rows[0].quantity + quantity;
        await pool.query(
          'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
          [newQuantity, cartId, productId]
        );
      } else {
        // Add new item if it doesn't exist
        await pool.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
          [cartId, productId, quantity]
        );
      }
      
      // Update cart total price
      await this.updateCartTotal(cartId);
      
      return this.getCartWithItems(cartId);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },
  
  // Update cart item quantity
  async updateItem(cartId, productId, quantity) {
    try {
      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
        [quantity, cartId, productId]
      );
      
      // Update cart total price
      await this.updateCartTotal(cartId);
      
      return this.getCartWithItems(cartId);
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },
  
  // Remove item from cart
  async removeItem(cartId, productId) {
    try {
      await pool.query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cartId, productId]
      );
      
      // Update cart total price
      await this.updateCartTotal(cartId);
      
      return this.getCartWithItems(cartId);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },
  
  // Clear cart (remove all items)
  async clearCart(cartId) {
    try {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
      await pool.query('UPDATE carts SET total_price = 0 WHERE id = $1', [cartId]);
      
      return { id: cartId, items: [], total_price: 0 };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
  
  // Helper method to get cart with items
  async getCartWithItems(cartId) {
    try {
      const cartResult = await pool.query('SELECT * FROM carts WHERE id = $1', [cartId]);
      
      if (cartResult.rows.length === 0) {
        return null;
      }
      
      const cart = cartResult.rows[0];
      
      const itemsResult = await pool.query(
        `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.stock, p.seller_id 
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = $1`,
        [cartId]
      );
      
      return {
        ...cart,
        items: itemsResult.rows
      };
    } catch (error) {
      console.error('Error getting cart with items:', error);
      throw error;
    }
  },
  
  // Helper method to update cart total price
  async updateCartTotal(cartId) {
    try {
      await pool.query(
        `UPDATE carts SET total_price = (
          SELECT COALESCE(SUM(p.price * ci.quantity), 0)
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.id
          WHERE ci.cart_id = $1
        ), updated_at = NOW() WHERE id = $1`,
        [cartId]
      );
    } catch (error) {
      console.error('Error updating cart total:', error);
      throw error;
    }
  }
};

export default Cart;
