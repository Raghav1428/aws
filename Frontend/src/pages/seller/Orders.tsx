import { useState, useEffect } from 'react';
import { IndianRupee, Package, User } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';

interface SellerOrder {
  id: string;
  buyerName: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
  status: string;
}

export const SellerOrders = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/seller');
      const backend = response.data?.orders || response.data || [];
      const sellerId = user ? String(user.id) : '';
      const flattened: SellerOrder[] = backend.flatMap((o: any) => {
        const created = o.createdAt || o.created_at || new Date().toISOString();
        const status = o.status || 'delivered';
        const buyerName = o.buyerName || o.buyer_name || 'Buyer';
        const items = Array.isArray(o.items) ? o.items : [];
        // Keep only items that belong to the current seller when possible
        const sellerItems = items.filter((it: any) => !sellerId || String(it.sellerId ?? it.seller_id ?? '') === sellerId);
        const useItems = sellerItems.length ? sellerItems : items;
        return useItems.map((it: any) => {
          const productName = it.productName || it.product_name || '';
          const qty = Number(it.quantity ?? 0);
          const price = Number(it.price ?? 0);
          return {
            id: String(o.id),
            buyerName,
            productName,
            quantity: Number.isFinite(qty) ? qty : 0,
            price: Number.isFinite(price) ? price : 0,
            total: (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(price) ? price : 0),
            createdAt: created,
            status,
          };
        });
      });
      setOrders(flattened);
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

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => order.status === filterStatus);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-600 mt-1">Track and manage orders for your products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Unique Buyers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(orders.map((o) => o.buyerName)).size}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Order History</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">#{order.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-slate-900">{order.buyerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">{order.productName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">{order.quantity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">₹{order.total.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
