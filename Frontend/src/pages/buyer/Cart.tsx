import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Tag } from 'lucide-react';
import api from '../../lib/api';
import { CartItem } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';

export const Cart = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      // Backend returns { message, cart: { items: [{ product: { id, name, price, stock }, quantity }], ... } }
      const items = response.data?.cart?.items || [];
      const normalized: CartItem[] = items.map((it: any) => ({
        id: String(it.product.id),
        productId: String(it.product.id),
        quantity: Number(it.quantity),
        product: {
          id: String(it.product.id),
          name: it.product.name,
          description: '',
          price: Number(it.product.price),
          stock: Number(it.product.stock),
          category: '',
          images: [],
          sellerId: '',
          createdAt: new Date().toISOString(),
        },
      }));
      const withImages = await attachProductImages(normalized);
      setCartItems(withImages);
    } catch (error) {
      showToast('error', 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const attachProductImages = async (items: CartItem[]): Promise<CartItem[]> => {
    const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
    const fetches = uniqueIds.map(async (pid) => {
      try {
        const res = await api.get(`/api/products/${pid}`);
        const p = res.data || {};
        let imgs: any = Array.isArray(p.images)
          ? p.images
          : Array.isArray(p.imageUrls)
          ? p.imageUrls
          : Array.isArray(p.image_urls)
          ? p.image_urls
          : p.images ?? p.imageUrls ?? p.image_urls ?? [];
        if (typeof imgs === 'string') {
          try {
            const parsed = JSON.parse(imgs);
            imgs = Array.isArray(parsed) ? parsed : [String(parsed)];
          } catch {
            imgs = imgs.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        if (!Array.isArray(imgs)) imgs = [];
        return [pid, imgs] as const;
      } catch {
        return [pid, []] as const;
      }
    });
    const results = await Promise.all(fetches);
    const idToImages = new Map<string, string[]>(results);
    return items.map((it) => ({
      ...it,
      product: { ...it.product, images: idToImages.get(it.productId) || [] },
    }));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await api.put(`/api/cart/item`, { productId: itemId, quantity });
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
      showToast('success', 'Cart updated');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.delete(`/api/cart/item/${itemId}`);
      setCartItems(cartItems.filter((item) => item.id !== itemId));
      showToast('success', 'Item removed');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to remove item');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const response = await api.get(`/api/coupons/verify/${couponCode}`);
      // Backend returns { message, coupon: { code, discount, expirationDate } }
      const c = response.data?.coupon;
      setAppliedCoupon(
        c
          ? { code: c.code, discountType: 'percentage', discountValue: Number(c.discount) }
          : null
      );
      if (c?.code) {
        localStorage.setItem('appliedCouponCode', c.code);
        if (typeof c.discount !== 'undefined') {
          localStorage.setItem('appliedCouponDiscountPercent', String(Number(c.discount)));
        }
      }
      showToast('success', 'Coupon applied!');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
      localStorage.removeItem('appliedCouponCode');
      localStorage.removeItem('appliedCouponDiscountPercent');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    localStorage.removeItem('appliedCouponCode');
    localStorage.removeItem('appliedCouponDiscountPercent');
    showToast('info', 'Coupon removed');
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();

    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      return appliedCoupon.discountValue;
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <Card className="max-w-md mx-auto">
          <CardBody className="space-y-4">
            <ShoppingBag className="w-16 h-16 mx-auto text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="text-slate-600">Add some products to get started</p>
            <Button onClick={() => navigate('/')}>Browse Products</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardBody>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{item.product.name}</h3>
                    <p className="text-slate-600 text-sm mb-2">{item.product.category}</p>
                    <p className="text-lg font-bold text-slate-900">
                      ₹{item.product.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Apply Coupon</h2>
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-green-600 hover:text-green-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button variant="secondary" onClick={applyCoupon} isLoading={isApplyingCoupon}>
                    Apply
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    ₹{calculateSubtotal().toLocaleString()}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{calculateDiscount().toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
