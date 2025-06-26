import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthenticatedFetch } from './hooks/useAppQuery';
import { useShop } from './hooks/useShop';
import { Loading } from '@shopify/polaris';
import { Suspense, lazy, useEffect, useState } from 'react';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const AIQueries = lazy(() => import('./pages/AIQueries'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));

export default function AppRoutes() {
  const fetch = useAuthenticatedFetch();
  const { shop, loading: shopLoading } = useShop();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/validate');
        const data = await response.json();
        setIsAuthenticated(data.success);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [fetch]);

  if (!authChecked || shopLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/products"
          element={isAuthenticated ? <Products /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/ai-queries"
          element={isAuthenticated ? <AIQueries /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />}
        />
        <Route
          path=""/analytics" element={isAuthenticated ? <AnalyticsPage /> : <Navigate to="/login" replace />}
        />

        {/* Fallback routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}