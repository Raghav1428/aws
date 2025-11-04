import { pool } from '../config/db.js';

// User model functions for PostgreSQL
const User = {
    // Find user by ID
    findById: async (id) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    // Find user by ID excluding password
    findByIdWithoutPassword: async (id) => {
        const result = await pool.query(
            'SELECT id, name, email, phone_number, address, role, account_balance, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    // Find user by email
    findByEmail: async (email) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    },

    // Create new user
    create: async (userData) => {
        const { name, email, password, phoneNumber, address, role = 'buyer', accountBalance = 0 } = userData;
        
        const result = await pool.query(
            `INSERT INTO users (name, email, password, phone_number, address, role, account_balance) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [name, email, password, phoneNumber, address, role, accountBalance]
        );
        
        return result.rows[0];
    },

    // Update user
    update: async (id, userData) => {
        const { name, email, phoneNumber, address, role, accountBalance } = userData;
        
        const result = await pool.query(
            `UPDATE users 
             SET name = $1, email = $2, phone_number = $3, address = $4, role = $5, account_balance = $6, updated_at = NOW() 
             WHERE id = $7 
             RETURNING *`,
            [name, email, phoneNumber, address, role, accountBalance, id]
        );
        
        return result.rows[0];
    },

    // Delete user
    delete: async (id) => {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return true;
    }
};

export default User;
