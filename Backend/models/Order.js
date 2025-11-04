import { pool } from '../config/db.js';

const Order = {
  async create({ userId, items, totalPrice, couponId = null, status = 'completed' }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query('SELECT account_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
      if (userRes.rows.length === 0) throw new Error('User not found');
      const balance = Number(userRes.rows[0].account_balance);
      if (balance < Number(totalPrice)) throw new Error('Insufficient balance');

      for (const item of items) {
        const prodRes = await client.query('SELECT stock, price FROM products WHERE id = $1 FOR UPDATE', [item.productId]);
        if (prodRes.rows.length === 0) throw new Error(`Product not found: ${item.productId}`);
        const stock = Number(prodRes.rows[0].stock);
        if (stock < item.quantity) throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      const orderRes = await client.query(
        `INSERT INTO orders (user_id, total_price, coupon_id, status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, totalPrice, couponId, status]
      );
      const order = orderRes.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.price]
        );
        await client.query(
          `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
          [item.quantity, item.productId]
        );
      }

      await client.query(
        `UPDATE users SET account_balance = account_balance - $1, updated_at = NOW() WHERE id = $2`,
        [totalPrice, userId]
      );

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId) {
    const ordersRes = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const orders = ordersRes.rows;
    const result = [];
    for (const o of orders) {
      const itemsRes = await pool.query(
        `SELECT oi.*, p.name FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [o.id]
      );
      result.push({ ...o, items: itemsRes.rows });
    }
    return result;
  },

  async findBySellerId(sellerId) {
    const ordersRes = await pool.query(
      `SELECT DISTINCT o.*
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE p.seller_id = $1
      ORDER BY o.created_at DESC`,
      [sellerId]
    );

    const orders = ordersRes.rows;
    const result = [];

    for (const order of orders) {
      const itemsRes = await pool.query(
        `SELECT oi.id, oi.quantity, oi.price, p.name, p.id as product_id
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1 AND p.seller_id = $2`,
        [order.id, sellerId]
      );

      result.push({
        ...order,
        items: itemsRes.rows,
      });
    }

    return result;
  }

};

export default Order;
