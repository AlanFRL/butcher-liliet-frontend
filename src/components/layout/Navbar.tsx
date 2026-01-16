import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  ClipboardList,
  Boxes
} from 'lucide-react';
import { useAuthStore } from '../../store';

interface NavbarProps {
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'Pedidos', path: '/orders', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'Productos', path: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'Inventario', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Caja', path: '/cash', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'Reportes', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Configuración', path: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  ];
  
  const filteredNav = navigation.filter((item) =>
    item.roles.includes(currentUser?.role || '')
  );
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-primary-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Logo - Reemplaza la imagen con tu logo */}
            <img 
              src="/logo.png" 
              alt="Butcher Lilieth" 
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => {
                // Fallback si no hay imagen
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 bg-accent-500 rounded-lg hidden items-center justify-center font-bold text-primary-900">
              BL
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold leading-tight">Butcher Lilieth</h1>
              <p className="text-xs text-gray-300">Carnes Premium</p>
              <p className="text-xs text-primary-200">Sistema POS</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center overflow-x-auto">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="hidden lg:flex items-center space-x-2">
              <User className="w-5 h-5" />
              <div className="text-sm">
                <p className="font-medium">{currentUser?.fullName}</p>
                <p className="text-xs text-primary-200">{currentUser?.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary-800 hover:bg-primary-700 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
