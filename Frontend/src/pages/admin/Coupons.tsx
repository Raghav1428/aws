import { useState, useEffect } from 'react';
import { Tag, User } from 'lucide-react';
import api from '../../lib/api';
import { Coupon } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';

interface CouponWithSeller extends Coupon {
  sellerName?: string;
}

export const AdminCoupons = () => {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<CouponWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeller, setFilterSeller] = useState('all');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/api/admin/coupons');
      setCoupons(response.data);
    } catch (error) {
      showToast('error', 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const sellers = ['all', ...new Set(coupons.map((c) => c.sellerName).filter(Boolean))];

  const filteredCoupons = filterSeller === 'all'
    ? coupons
    : coupons.filter((coupon) => coupon.sellerName === filterSeller);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Coupons</h1>
        <p className="text-slate-600 mt-1">View all coupons across the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Coupons</p>
                <p className="text-2xl font-bold text-slate-900">{coupons.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Coupons</p>
                <p className="text-2xl font-bold text-slate-900">
                  {coupons.filter((c) => c.isActive).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Unique Sellers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(coupons.map((c) => c.sellerId).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">All Coupons</h2>
            <select
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sellers.map((seller) => (
                <option key={seller} value={seller}>
                  {seller === 'all' ? 'All Sellers' : seller}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600">No coupons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Min. Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-slate-900">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-900">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}%`
                            : `₹${coupon.discountValue}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">
                          {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-900">{coupon.sellerName || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">
                          {coupon.expiryDate
                            ? new Date(coupon.expiryDate).toLocaleDateString()
                            : 'No expiry'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            coupon.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
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
