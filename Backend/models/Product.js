import { pool } from '../config/db.js';

// Product model functions for PostgreSQL
const Product = {
    // Find all products with optional filters
    findAll: async (filters = {}) => {
        let query = `
            SELECT p.*, u.name as seller_name, u.email as seller_email 
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE 1=1
        `;
        
        const queryParams = [];
        let paramIndex = 1;
        
        // Add category filter
        if (filters.category) {
            query += ` AND $${paramIndex} = ANY(p.category)`;
            queryParams.push(filters.category);
            paramIndex++;
        }
        
        // Add price range filter
        if (filters.minPrice) {
            query += ` AND p.price >= $${paramIndex}`;
            queryParams.push(filters.minPrice);
            paramIndex++;
        }
        
        if (filters.maxPrice) {
            query += ` AND p.price <= $${paramIndex}`;
            queryParams.push(filters.maxPrice);
            paramIndex++;
        }
        
        // Add search filter
        if (filters.search) {
            query += ` AND p.name ILIKE $${paramIndex}`;
            queryParams.push(`%${filters.search}%`);
            paramIndex++;
        }
        
        const result = await pool.query(query, queryParams);
        return result.rows;
    },
    
    // Find product by ID
    findById: async (id) => {
        const result = await pool.query(
            `SELECT p.*, u.name as seller_name, u.email as seller_email 
             FROM products p
             JOIN users u ON p.seller_id = u.id
             WHERE p.id = $1`,
            [id]
        );
        return result.rows[0];
    },
    
    // Create new product
    create: async (productData) => {
        const { name, description, price, category, sellerId, stock, imageUrls = [] } = productData;
        
        const result = await pool.query(
            `INSERT INTO products (name, description, price, category, seller_id, stock, image_urls) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [name, description, price, category, sellerId, stock, imageUrls]
        );
        
        return result.rows[0];
    },
    
    // Full-text search with optional price range and category filters
    search: async ({ q, minPrice, maxPrice, category }) => {
        let query = `
            SELECT 
                p.*, 
                u.name AS seller_name, 
                u.email AS seller_email,
                CASE 
                    WHEN $1::text IS NULL OR $1 = '' THEN 0
                    ELSE ts_rank(
                        setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
                        setweight(to_tsvector('english', coalesce(p.category_text, '')), 'C'),
                    websearch_to_tsquery('english', $1)
                    )
                END AS rank,
                CASE 
                    WHEN $1::text IS NULL OR $1 = '' THEN 0
                    ELSE GREATEST(
                        word_similarity(p.name, $1),
                        word_similarity(p.description, $1),
                        word_similarity(p.category_text, $1)
                    )
                END AS sim
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE 1=1
        `;
    
        const params = [q || ''];
        let idx = 2;
    
        if (q && q.trim()) {
            query += `
            AND (
                -- Full Text Search
                (
                    (setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(p.category_text, '')), 'C'))
                    @@ websearch_to_tsquery('english', $1)
                )
    
                -- Fuzzy Search (typos & similar words)
                OR word_similarity(p.name, $1) > 0.2
                OR word_similarity(p.description, $1) > 0.2
                OR word_similarity(p.category_text, $1) > 0.2
    
                -- Prefix + Partial Matches
                OR p.name ILIKE $1 || '%'
                OR p.name ILIKE '%' || $1 || '%'
                OR p.description ILIKE '%' || $1 || '%'
                OR p.category_text ILIKE '%' || $1 || '%'
            )
            `;
        }
    
        if (minPrice != null) {
            query += ` AND p.price >= $${idx}`;
            params.push(minPrice);
            idx++;
        }
    
        if (maxPrice != null) {
            query += ` AND p.price <= $${idx}`;
            params.push(maxPrice);
            idx++;
        }
    
        if (category) {
            query += ` AND p.category_text ILIKE '%' || $${idx} || '%'`;
            params.push(category);
            idx++;
        }
    
        const finalQuery = `
            SELECT * FROM (
                ${query}
            ) AS sub
            ${q && q.trim()
                ? 'ORDER BY (COALESCE(rank, 0) + COALESCE(sim, 0) * 2) DESC, updated_at DESC'
                : 'ORDER BY updated_at DESC'};
        `;
    
        const result = await pool.query(finalQuery, params);
        
        return result.rows;
    },


    
    // Update product
    update: async (id, productData) => {
        const { name, description, price, category, stock, imageUrls } = productData;
        
        let query = `UPDATE products SET updated_at = NOW()`;
        const queryParams = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
            query += `, name = $${paramIndex}`;
            queryParams.push(name);
            paramIndex++;
        }
        
        if (description !== undefined) {
            query += `, description = $${paramIndex}`;
            queryParams.push(description);
            paramIndex++;
        }
        
        if (price !== undefined) {
            query += `, price = $${paramIndex}`;
            queryParams.push(price);
            paramIndex++;
        }
        
        if (category !== undefined) {
            query += `, category = $${paramIndex}`;
            queryParams.push(category);
            paramIndex++;
        }
        
        if (stock !== undefined) {
            query += `, stock = $${paramIndex}`;
            queryParams.push(stock);
            paramIndex++;
        }
        
        if (imageUrls !== undefined) {
            query += `, image_urls = $${paramIndex}`;
            queryParams.push(imageUrls);
            paramIndex++;
        }
        
        query += ` WHERE id = $${paramIndex} RETURNING *`;
        queryParams.push(id);
        
        const result = await pool.query(query, queryParams);
        return result.rows[0];
    },
    
    // Delete product
    delete: async (id) => {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        return true;
    }
};

export default Product;
