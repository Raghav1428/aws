import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, User, Package, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const buyerLinks = [
    { to: '/', label: 'Home', icon: ShoppingBag },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
    { to: '/buyer/orders', label: 'My Orders', icon: Package },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const sellerLinks = [
    { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seller/products', label: 'Products', icon: Package },
    { to: '/seller/coupons', label: 'Coupons', icon: ShoppingBag },
    { to: '/seller/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/coupons', label: 'Coupons', icon: ShoppingBag },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const links = user?.role === 'seller' ? sellerLinks : user?.role === 'admin' ? adminLinks : buyerLinks;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <ShoppingBag className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-slate-900">MarketPlace</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{user?.name}</span>
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                {user?.role}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-200">
              <div className="px-4 py-2 text-sm">
                <div className="font-medium text-slate-900">{user?.name}</div>
                <div className="text-slate-600">{user?.email}</div>
                <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
