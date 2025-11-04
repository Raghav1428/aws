# E-Commerce Marketplace Backend with Order Management

## 📌 Project Overview
This is a backend system for an **E-Commerce Marketplace** that allows users to browse products, manage shopping carts, and place orders. Sellers can list and update products, while authentication ensures secure access to different features based on user roles.

## 🚀 Features

### 🛍️ Product Management
- Sellers can **Create, Read, Update, and Delete (CRUD)** products.
- Users can fetch product listings and search using **categories, price range, and keywords**.

### 🛒 Shopping Cart & Checkout
- Users can **add, update, and remove items** from their shopping cart.
- The cart displays the **total price and remaining account balance**.
- Secure **order processing** after checkout.

### 🔐 User Authentication & Profiles
- **JWT Authentication** for secure login and user sessions.
- **Role-Based Access Control (RBAC):**
  - **Buyers** can manage their cart, browse products, and place orders.
  - **Sellers** can add, update, and remove products.
- Middleware to enforce **access control**.

### 🛠 Database & Backend
- Developed using **Express.js** as the backend framework.
- **MongoDB** as the database for efficient storage.
- **Secure API endpoints** with authentication and authorization.
- Implemented **error handling and logging** for debugging and smooth user experience.
- Well-documented API with **request/response formats** and usage examples.

## 🎯 Bonus Features

### 🎟 Discount & Coupon System
- Sellers can create **custom coupon codes** for discounts.
- Buyers can apply **coupons during checkout** for price reductions.

### 📩 Webhook Functionality
- Implemented **webhook notifications** for cart status changes.

## ⚙️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT-based authentication with RBAC
- **API Documentation:** Postman Documenter

## 🔧 Installation & Setup
1. **Clone the Repository:**
   ```sh
   git clone https://github.com/Krish-Kavya-02/E-Commerce-Backend.git
   cd E-Commerce-Backend
   ```
2. **Install Dependencies:**
   ```sh
   npm install
   ```
3. **Set up Environment Variables (.env):**
   ```
   MONGO_URI = mongodb://127.0.0.1:27017/ecommerceDB
   PORT = 3000
   JWT_SECRET_KEY = "THISisMY@SECRET.key"
   ```
4. **Run the Server:**
   ```sh
   npm run dev
   ```
5. **API Endpoints Documentation:**
   - Available at [API Documentation](https://documenter.getpostman.com/view/38493053/2sAYdmjTC4)

## 📜 Few API Endpoints
| Method | Endpoint | Description |
|--------|------------|-------------|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login and get JWT token |
| `GET` | `/products` | Fetch all products |
| `POST` | `/cart/add` | Add item to cart |
| `POST` | `/order` | Place order |


**Developed by [Krish Kavya Upadhyay](https://github.com/Krish-Kavya-02)**



