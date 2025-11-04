import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config()

const pool = new Pool({
  user: process.env.RDS_USER,
  host: process.env.RDS_HOST,
  database: process.env.RDS_DB_NAME,
  password: process.env.RDS_DB_PASSWORD,
  port: process.env.RDS_DB_PORT,
  ssl: { rejectUnauthorized: false },
});

const connectDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('\nPostgreSQL database connected successfully');
  } catch (error) {
    console.log("PostgreSQL connection error: ", error);
    process.exit(1);
  }
};

export { pool, connectDB };
