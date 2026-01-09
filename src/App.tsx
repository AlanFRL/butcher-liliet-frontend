import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useColorScheme } from './hooks/useColorScheme';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { ProductsPage } from './pages/ProductsPage';
import { CashPage } from './pages/CashPage';
import { CashOpenPage } from './pages/CashOpenPage';
import { CashClosePage } from './pages/CashClosePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OrdersPage } from './pages/OrdersPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout with Navbar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={handleLogout} />
      {children}
    </div>
  );
};

function App() {
  // Cargar el esquema de colores guardado al iniciar la aplicación
  useColorScheme();
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <MainLayout>
                <POSPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProductsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cash"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CashPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cash/open"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CashOpenPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cash/close"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CashClosePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReportsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrdersPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
