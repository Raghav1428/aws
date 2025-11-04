import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";

import authRoutes from "./routes/AuthRoutes.js";
import productRoutes from "./routes/ProductRoutes.js";
import cartRoutes from "./routes/CartRoutes.js";
import couponRoutes from "./routes/CouponRoutes.js";
import orderRoutes from "./routes/OrderRoutes.js";

// Initialize database connection
const initializeApp = async () => {
  try {
    // Connect to PostgreSQL
    console.log('Trying to connect to AWS PostgreSQL database');
    await connectDB();
    
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(cors());
    app.use(bodyParser.json());
    
    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/coupons", couponRoutes);
    app.use("/api/orders", orderRoutes);
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();
