import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import { Home } from './pages/buyer/Home';
import { ProductDetail } from './pages/buyer/ProductDetail';
import { Cart } from './pages/buyer/Cart';
import { Checkout } from './pages/buyer/Checkout';
import { Orders } from './pages/buyer/Orders';
import { Profile } from './pages/Profile';

import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerProducts } from './pages/seller/Products';
import { SellerCoupons } from './pages/seller/Coupons';
import { SellerOrders } from './pages/seller/Orders';

import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminCoupons } from './pages/admin/Coupons';

const AppRoutes = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'seller', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/coupons"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerCoupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCoupons />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                user?.role === 'seller'
                  ? '/seller/dashboard'
                  : user?.role === 'admin'
                  ? '/admin/dashboard'
                  : '/'
              }
              replace
            />
          }
        />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
