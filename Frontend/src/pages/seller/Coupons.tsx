import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import api from '../../lib/api';
import { Coupon } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';

export const SellerCoupons = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderValue: '',
    expiryDate: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      // Backend doesn't expose seller-only list; use active coupons and filter by seller if available
      const response = await api.get('/api/coupons/active');
      const raw = response.data?.coupons || response.data || [];
      const mapped: Coupon[] = raw.map((c: any) => ({
        id: String(c.id ?? c.couponId ?? ''),
        code: c.code,
        discountType: 'percentage',
        discountValue: Number(c.discount ?? c.discountValue ?? 0),
        expiryDate: c.expirationDate ?? c.expiryDate ?? null,
        sellerId: c.sellerId ?? c.seller_id,
        isActive: true,
      }));
      const filtered = user ? mapped.filter((c) => String(c.sellerId ?? '') === String(user.id)) : mapped;
      setCoupons(filtered);
    } catch (error) {
      showToast('error', 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      expiryDate: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Backend expects { code, discount, expirationDate }
      const payload = {
        code: formData.code.toUpperCase(),
        discount: parseFloat(formData.discountValue),
        expirationDate: formData.expiryDate || undefined,
      };

      await api.post('/api/coupons', payload);
      showToast('success', 'Coupon created successfully');
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to create coupon');
    } finally {
      setIsSaving(false);
    }
  };

  // No delete endpoint in backend; hiding delete action to avoid errors

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Coupons</h1>
          <p className="text-slate-600 mt-1">Create and manage discount coupons</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Tag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No coupons yet</h2>
            <p className="text-slate-600 mb-4">Create promotional coupons to attract buyers</p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-green-600/10 rounded-full -mr-16 -mt-16" />
              <CardBody className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="bg-green-100 px-4 py-2 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{coupon.code}</p>
                  </div>
                  {/* Delete disabled: backend has no delete route */}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Discount</span>
                    <span className="font-semibold text-slate-900">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`}
                    </span>
                  </div>

                  {coupon.minOrderValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Min. Order</span>
                      <span className="font-semibold text-slate-900">
                        ₹{coupon.minOrderValue}
                      </span>
                    </div>
                  )}

                  {coupon.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Expires</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        coupon.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Coupon"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Coupon Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            placeholder="SUMMER2024"
            maxLength={20}
          />

          <Select
            label="Discount Type"
            value={formData.discountType}
            onChange={(e) =>
              setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })
            }
            options={[
              { value: 'percentage', label: 'Percentage (%)' },
              { value: 'fixed', label: 'Fixed Amount (₹)' },
            ]}
          />

          <Input
            label={
              formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (₹)'
            }
            type="number"
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
            required
            min="0"
            max={formData.discountType === 'percentage' ? '100' : undefined}
            step="0.01"
            placeholder={formData.discountType === 'percentage' ? '10' : '100'}
          />

          <Input
            label="Minimum Order Value (₹) - Optional"
            type="number"
            value={formData.minOrderValue}
            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
            min="0"
            step="0.01"
            placeholder="500"
          />

          <Input
            label="Expiry Date - Optional"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
