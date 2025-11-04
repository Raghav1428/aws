import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signup(name, email, password,phoneNumber, address, role);

      if (role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }

      showToast('success', 'Account created successfully!');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoOHYtOGgtOHptLTQgMHY4aDh2LThoLTh6bTAgNHY4aDh2LThoLTh6bS00IDB2OGg4di04aC04em0tNCAwdjhoOHYtOGgtOHptLTQgMHY4aDh2LThoLTh6bTAgNHY4aDh2LThoLTh6bS00IDB2OGg4di04aC04eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <ShoppingBag className="w-16 h-16 mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-center">Join MarketPlace Today</h1>
          <p className="text-xl text-teal-100 text-center max-w-md">
            Start your journey as a buyer or seller in our thriving marketplace community
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-teal-600 lg:hidden mb-4" />
            <h2 className="text-3xl font-bold text-slate-900">Create your account</h2>
            <p className="mt-2 text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <Input
                label="Full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                autoComplete="name"
              />
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <Input
                label="Phone Number"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="9876543210"
                autoComplete="phone"
              />
              <Input
                label="Address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="123 Main Street"
                autoComplete="address"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      role === 'buyer'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Buy Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      role === 'seller'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Sell Products
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800" size="lg" isLoading={isLoading}>
              Create account
            </Button>

            <p className="text-xs text-center text-slate-500">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
