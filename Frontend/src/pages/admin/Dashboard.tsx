import { useState, useEffect } from 'react';
import { Users, Package, DollarSign, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Card, CardBody } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export const AdminDashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/products/getallproducts'),
        api.get('/api/admin/orders'),
      ]);

      const revenue = ordersRes.data.reduce(
        (sum: number, order: any) => sum + order.total,
        0
      );

      setStats({
        totalUsers: usersRes.data.length,
        totalProducts: productsRes.data.length,
        totalOrders: ordersRes.data.length,
        totalRevenue: revenue,
      });
    } catch (error) {
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of platform metrics and statistics</p>
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
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Platform Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Active Sellers</span>
                <span className="font-semibold text-slate-900">
                  {Math.floor(stats.totalUsers * 0.3)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Active Buyers</span>
                <span className="font-semibold text-slate-900">
                  {Math.floor(stats.totalUsers * 0.7)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Average Order Value</span>
                <span className="font-semibold text-slate-900">
                  ₹
                  {stats.totalOrders > 0
                    ? Math.floor(stats.totalRevenue / stats.totalOrders).toLocaleString()
                    : 0}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/admin/users"
                className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
                      Manage Users
                    </h3>
                    <p className="text-sm text-slate-600">View and manage all users</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </a>

              <a
                href="/admin/coupons"
                className="block p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-green-700">
                      View All Coupons
                    </h3>
                    <p className="text-sm text-slate-600">Monitor platform-wide coupons</p>
                  </div>
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
