import Coupon from '../models/Coupon.js';

export const createCoupon = async (req, res) => {
  try {
    const { code, discount, expirationDate } = req.body;
    const sellerId = req.user.id; 

    
    if (!code || !discount || !expirationDate) {
      return res.status(400).json({ message: 'Code, discount, and expiration date are required' });
    }

  
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return res.status(400).json({ message: 'Discount must be a number between 0 and 100' });
    }

    
    const parsedDate = new Date(expirationDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date' });
    }

    try {
      const savedCoupon = await Coupon.create({
        sellerId,
        code,
        discount,
        expirationDate: parsedDate,
      });
      res.status(201).json({
        message: 'Coupon created successfully',
        coupon: savedCoupon,
      });
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findActive();

    res.status(200).json({
      message: coupons.length ? 'Active coupons retrieved' : 'No active coupons found',
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll();

    res.status(200).json({
      message: coupons.length ? 'Coupons retrieved' : 'No coupons found',
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const getSellerCoupons = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const sellerIdNum = Number(sellerId);
    if (!sellerIdNum || Number.isNaN(sellerIdNum)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    if (sellerIdNum !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these coupons' });
    }

    const coupons = await Coupon.findBySellerId(sellerIdNum);

    res.status(200).json({
      message: coupons.length ? 'Seller coupons retrieved' : 'No coupons found for this seller',
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller coupons', error: error.message });
  }
};

export const verifyCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findByCode(code);

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    res.status(200).json({
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        discount: Number(coupon.discount),
        expirationDate: coupon.expiration_date,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying coupon', error: error.message });
  }
};
