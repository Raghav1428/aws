import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';
import api from '../../lib/api';
import { CartItem } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';

export const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(0);

  useEffect(() => {
    const storedDiscount = Number(localStorage.getItem('appliedCouponDiscountPercent') || '0');
    setCouponDiscountPercent(Number.isFinite(storedDiscount) ? storedDiscount : 0);
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      const items = response.data?.cart?.items || [];
      if (items.length === 0) {
        navigate('/cart');
      }
      const normalized = items.map((it: any) => ({
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
      navigate('/cart');
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

  const placeOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const code = localStorage.getItem('appliedCouponCode') || undefined;
      await api.post('/api/orders', code ? { couponCode: code } : {});
      showToast('success', 'Order placed successfully!');
      localStorage.removeItem('appliedCouponCode');
      localStorage.removeItem('appliedCouponDiscountPercent');
      navigate('/buyer/orders');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = couponDiscountPercent > 0 ? (subtotal * couponDiscountPercent) / 100 : 0;
    return subtotal - discount;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{item.product.name}</h3>
                  <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-slate-900">
                ₹{(item.product.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}

          <div className="pt-4 border-t-2 border-slate-200">
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-slate-900">Total Amount</span>
              <span className="text-slate-900">₹{calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-indigo-50 border-indigo-200">
        <CardBody>
          <div className="flex gap-3">
            <Package className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-900">
              <p className="font-semibold mb-1">Order Confirmation</p>
              <p>
                By clicking "Place Order", you confirm that you want to purchase these items.
                Your order will be processed immediately.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/cart')} className="flex-1">
          Back to Cart
        </Button>
        <Button
          onClick={placeOrder}
          isLoading={isPlacingOrder}
          className="flex-1"
          size="lg"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Place Order
        </Button>
      </div>
    </div>
  );
};
