import { useState, useEffect } from 'react';
import { Package, Calendar, DollarSign, Tag } from 'lucide-react';
import api from '../../lib/api';
import { Order } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';

export const Orders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      // Backend returns { message, orders: [{ id, items:[{productId, quantity, price}], totalPrice, status?, created_at? }] }
      const backendOrders = response.data?.orders || [];
      const normalized = backendOrders.map((o: any) => {
        const rawItems = Array.isArray(o.items) ? o.items : [];
        const items = rawItems.map((it: any, idx: number) => {
          const pid = it.productId ?? it.product_id;
          const priceNum = Number(it.price ?? 0);
          const qtyNum = Number(it.quantity ?? 0);
          return {
            id: `${o.id}-${pid ?? idx}`,
            productId: String(pid ?? ''),
            productName: '',
            quantity: Number.isFinite(qtyNum) ? qtyNum : 0,
            price: Number.isFinite(priceNum) ? priceNum : 0,
            sellerId: String(it.sellerId ?? it.seller_id ?? ''),
          };
        });

        const rawTotal = o.totalPrice ?? o.total_price;
        let totalNum = Number(rawTotal);
        if (!Number.isFinite(totalNum)) {
          totalNum = items.reduce((s: number, it: any) => s + Number(it.price) * Number(it.quantity), 0);
        }

        return {
          id: String(o.id),
          userId: String(o.userId ?? o.user_id ?? ''),
          items,
          subtotal: totalNum,
          discount: Number(o.discount ?? o.discount_amount ?? 0) || 0,
          total: totalNum,
          status: (o.status || 'delivered') as any,
          couponCode: o.couponCode ?? o.coupon_code,
          createdAt: o.createdAt || o.created_at || new Date().toISOString(),
        };
      });
      setOrders(normalized);
    } catch (error) {
      showToast('error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Card className="max-w-md mx-auto">
          <CardBody className="space-y-4">
            <Package className="w-16 h-16 mx-auto text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900">No orders yet</h2>
            <p className="text-slate-600">Your order history will appear here</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card
            key={order.id}
            hoverable
            className="cursor-pointer"
            onClick={() => setSelectedOrder(order)}
          >
            <CardBody>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">Order #{order.id.slice(0, 8)}</h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>{order.items.length} item(s)</span>
                    </div>
                    {order.couponCode && (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <Tag className="w-4 h-4" />
                        <span>{order.couponCode}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{order.total.toLocaleString()}
                  </p>
                  {order.discount > 0 && (
                    <p className="text-sm text-green-600">
                      Saved ₹{order.discount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Order ID</p>
                <p className="font-semibold text-slate-900">#{selectedOrder.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-600">Order Date</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              {selectedOrder.couponCode && (
                <div>
                  <p className="text-sm text-slate-600">Coupon Applied</p>
                  <p className="font-semibold text-green-600">{selectedOrder.couponCode}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="text-sm text-slate-600">
                        Quantity: {item.quantity} × ₹{item.price.toLocaleString()}
                      </p>
                      {item.sellerName && (
                        <p className="text-xs text-slate-500">Seller: {item.sellerName}</p>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">
                  ₹{selectedOrder.subtotal.toLocaleString()}
                </span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-₹{selectedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">₹{selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
