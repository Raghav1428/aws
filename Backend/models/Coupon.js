import { pool } from '../config/db.js';

const Coupon = {
  async create({ sellerId, code, discount, expirationDate }) {
    const result = await pool.query(
      `INSERT INTO coupons (seller_id, code, discount, expiration_date)
       VALUES ($1, UPPER($2), $3, $4)
       RETURNING *`,
      [sellerId, code, discount, new Date(expirationDate)]
    );
    return result.rows[0];
  },

  async findByCode(code) {
    const result = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = UPPER($1) AND is_active = true AND expiration_date >= NOW()`,
      [code]
    );
    return result.rows[0] || null;
  },

  async findActive() {
    const result = await pool.query(
      `SELECT * FROM coupons 
       WHERE is_active = true AND expiration_date >= NOW() 
       ORDER BY expiration_date ASC`
    );
    return result.rows;
  },

  async findAll() {
    const result = await pool.query(
      `SELECT * FROM coupons ORDER BY expiration_date ASC`
    );
    return result.rows;
  },

  async findBySellerId(sellerId) {
    const result = await pool.query(
      `SELECT * FROM coupons WHERE seller_id = $1 ORDER BY expiration_date ASC`,
      [sellerId]
    );
    return result.rows;
  }
};

export default Coupon;
