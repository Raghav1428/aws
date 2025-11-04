import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Wallet, Edit2, Save, X } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: string;
  accountBalance?: number;
}

export const Profile = () => {
  const { showToast } = useToast();
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      const data = response.data;
      const normalized: ProfileData = {
        id: String(data.id),
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || data.phone_number || '',
        address: data.address || '',
        role: data.role || '',
        accountBalance: data.accountBalance !== undefined ? Number(data.accountBalance) : (data.account_balance !== undefined ? Number(data.account_balance) : undefined),
      };
      setProfile(normalized);
      setFormData({
        name: normalized.name,
        email: normalized.email,
        phoneNumber: normalized.phoneNumber,
        address: normalized.address,
      });
    } catch (error) {
      showToast('error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/api/auth/profile', formData);
      const updated = response.data?.user || response.data;
      const normalized: ProfileData = {
        id: String(updated.id),
        name: updated.name || formData.name,
        email: updated.email || formData.email,
        phoneNumber: updated.phoneNumber || updated.phone_number || formData.phoneNumber,
        address: updated.address || formData.address,
        role: updated.role || profile?.role || '',
        accountBalance: updated.accountBalance !== undefined ? Number(updated.accountBalance) : (updated.account_balance !== undefined ? Number(updated.account_balance) : profile?.accountBalance),
      };
      setProfile(normalized);
      setIsEditing(false);
      
      // Update localStorage with new user data
      if (user) {
        const updatedUser = {
          ...user,
          name: normalized.name,
          email: normalized.email,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      showToast('success', 'Profile updated successfully');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-slate-600">Failed to load profile</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-1">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                ) : (
                  <p className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900">
                    {profile.name || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                ) : (
                  <p className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900">
                    {profile.email || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900">
                    {profile.phoneNumber || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your address"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                  />
                ) : (
                  <p className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 whitespace-pre-line">
                    {profile.address || 'Not provided'}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" onClick={handleCancel} className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Account Details</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <span className="inline-block px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                  {profile.role || 'Not set'}
                </span>
              </div>

              {profile.accountBalance !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Account Balance
                  </label>
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{profile.accountBalance.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  User ID: {profile.id}
                </p>
              </div>
            </CardBody>
          </Card>

          {profile.role === 'buyer' && profile.accountBalance !== undefined && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Available Balance</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ₹{profile.accountBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

