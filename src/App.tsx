import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useCashStore } from './store';
import { useColorScheme } from './hooks/useColorScheme';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { TerminalSelectPage } from './pages/TerminalSelectPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { CashPage } from './pages/CashPage';
import { CashOpenPage } from './pages/CashOpenPage';
import { CashClosePage } from './pages/CashClosePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OrdersPage } from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Mostrar loading mientras se verifica el token
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout with Navbar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
  
  const { loadUserFromToken, isAuthenticated } = useAuthStore();
  const { loadCurrentSession } = useCashStore();
  
  // Intentar cargar usuario desde token al iniciar
  useEffect(() => {
    const initApp = async () => {
      await loadUserFromToken();
    };
    initApp();
  }, [loadUserFromToken]);
  
  // Cargar sesión actual cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadCurrentSession();
    }
  }, [isAuthenticated, loadCurrentSession]);
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Terminal Selection (protected but no navbar) */}
        <Route
          path="/select-terminal"
          element={
            <ProtectedRoute>
              <TerminalSelectPage />
            </ProtectedRoute>
          }
        />
        
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
          path="/inventory"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InventoryPage />
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
        
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CustomersPage />
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
