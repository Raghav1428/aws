import { useState, useEffect } from 'react';
import { Package, Tag, ShoppingCart } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalProducts: number;
  totalCoupons: number;
  totalOrders: number;
  totalRevenue: number;
}

export const SellerDashboard = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCoupons: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, couponsRes, sellerOrdersRes] = await Promise.all([
        api.get('/api/products/getallproducts'),
        api.get('/api/coupons/active'),
        api.get('/api/orders/seller'),
      ]);

      const productsRaw = productsRes.data || [];
      const normalizedProducts = productsRaw.map((p: any) => ({
        sellerId: String(p.sellerId ?? p.seller_id ?? ''),
      }));
      const sellerProducts = user
        ? normalizedProducts.filter((p: any) => p.sellerId === String(user.id))
        : normalizedProducts;

      const couponsRaw = couponsRes.data?.coupons || couponsRes.data || [];
      const sellerCoupons = user
        ? couponsRaw.filter((c: any) => String(c.sellerId ?? c.seller_id ?? '') === String(user.id))
        : couponsRaw;

      const backendOrders = sellerOrdersRes.data?.orders || sellerOrdersRes.data || [];
      // Sum revenue only for this seller's items if present
      let totalOrders = 0;
      let totalRevenue = 0;
      backendOrders.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        const sellerItems = user
          ? items.filter((it: any) => String(it.sellerId ?? it.seller_id ?? '') === String(user.id))
          : items;
        if (sellerItems.length) {
          totalOrders += 1;
          const orderRevenue = sellerItems.reduce((s: number, it: any) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0), 0);
          totalRevenue += orderRevenue;
        }
      });

      setStats({
        totalProducts: sellerProducts.length,
        totalCoupons: sellerCoupons.length,
        totalOrders,
        totalRevenue,
      });
    } catch (error) {
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Coupons',
      value: stats.totalCoupons,
      icon: Tag,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Seller Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's an overview of your store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardBody className="relative">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor} rounded-full -mr-8 -mt-8 opacity-50`} />
                <div className="relative">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <a
              href="/seller/products"
              className="block p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg hover:from-indigo-100 hover:to-indigo-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    Manage Products
                  </h3>
                  <p className="text-sm text-slate-600">Add, edit, or remove products</p>
                </div>
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </a>

            <a
              href="/seller/coupons"
              className="block p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-green-700">
                    Manage Coupons
                  </h3>
                  <p className="text-sm text-slate-600">Create and manage discount coupons</p>
                </div>
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </a>

            <a
              href="/seller/orders"
              className="block p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-purple-700">
                    View Orders
                  </h3>
                  <p className="text-sm text-slate-600">Track and manage your orders</p>
                </div>
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Performance Tips</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  Add high-quality product images to increase conversions
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  Create promotional coupons to attract more buyers
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  Keep your product stock levels updated regularly
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  Write detailed product descriptions to help buyers make decisions
                </p>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
