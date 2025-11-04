import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.body;

    const cart = await Cart.findByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const user = await User.findByIdWithoutPassword(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let totalPrice = cart.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

    let couponId = null;
    if (couponCode) {
      const coupon = await Coupon.findByCode(couponCode);
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid or expired coupon' });
      }
      const sellerIds = [...new Set(cart.items.map(item => String(item.seller_id)))];
      if (!sellerIds.includes(String(coupon.seller_id))) {
        return res.status(400).json({ message: 'Coupon not applicable to items in cart' });
      }
      const discount = (totalPrice * Number(coupon.discount)) / 100;
      totalPrice -= discount;
      couponId = coupon.id;
    }

    const orderItems = cart.items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = await Order.create({
      userId,
      items: orderItems,
      totalPrice,
      couponId,
      status: 'completed',
    });

    await Cart.clearCart(cart.id);

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
    console.log(error);
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findByUserId(userId);
    res.status(200).json({ message: orders.length ? 'Orders retrieved successfully' : 'No orders found', orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const orders = await Order.findBySellerId(sellerId);
    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found', orders: [] });
    }
    res.status(200).json({ message: 'Orders retrieved successfully', orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
    console.error('Error fetching seller orders:', error);
  }
};