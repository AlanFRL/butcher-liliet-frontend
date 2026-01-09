import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useCashStore, useSalesStore, useAuthStore } from '../store';

export const DashboardPage: React.FC = () => {
  const { currentSession } = useCashStore();
  const { getTodaysSales } = useSalesStore();
  const { currentUser } = useAuthStore();
  
  const todaysSales = getTodaysSales();
  const todaysTotal = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const todaysCount = todaysSales.length;
  
  const quickActions = [
    {
      title: 'Abrir Caja',
      description: 'Iniciar turno de trabajo',
      icon: DollarSign,
      path: '/cash/open',
      color: 'bg-green-500',
      show: !currentSession && ['ADMIN', 'CASHIER', 'MANAGER'].includes(currentUser?.role || ''),
    },
    {
      title: 'Ir al POS',
      description: 'Realizar ventas',
      icon: ShoppingCart,
      path: '/pos',
      color: 'bg-primary-600',
      show: currentSession?.status === 'OPEN',
    },
    {
      title: 'Cerrar Caja',
      description: 'Finalizar turno y arqueo',
      icon: DollarSign,
      path: '/cash/close',
      color: 'bg-orange-500',
      show: currentSession?.status === 'OPEN' && ['ADMIN', 'CASHIER', 'MANAGER'].includes(currentUser?.role || ''),
    },
    {
      title: 'Productos',
      description: 'Gestionar catálogo',
      icon: Package,
      path: '/products',
      color: 'bg-blue-500',
      show: ['ADMIN', 'MANAGER'].includes(currentUser?.role || ''),
    },
  ].filter((action) => action.show);
  
  const stats = [
    {
      title: 'Ventas Hoy',
      value: `Bs ${todaysTotal.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tickets Hoy',
      value: todaysCount.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Ticket Promedio',
      value: todaysCount > 0 ? `Bs ${(todaysTotal / todaysCount).toFixed(2)}` : 'Bs 0.00',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bienvenido, {currentUser?.fullName}
        </p>
      </div>
      
      {/* Estado de Caja */}
      <div className="mb-8">
        {currentSession?.status === 'OPEN' ? (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Caja Abierta</h3>
              <p className="text-sm text-green-700">
                Sesión iniciada a las {new Date(currentSession.openedAt).toLocaleTimeString()} - Monto inicial: Bs {currentSession.openingAmount.toFixed(2)}
              </p>
            </div>
            <Link
              to="/cash/close"
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
            >
              Cerrar Caja
            </Link>
          </div>
        ) : (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-6 h-6 text-orange-600 mr-3" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">Caja Cerrada</h3>
              <p className="text-sm text-orange-700">
                Debes abrir caja para comenzar a operar el POS
              </p>
            </div>
            {['ADMIN', 'CASHIER', 'MANAGER'].includes(currentUser?.role || '') && (
              <Link
                to="/cash/open"
                className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium"
              >
                Abrir Caja
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>
      
      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Últimas Ventas */}
      {todaysSales.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Últimas Ventas de Hoy</h2>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todaysSales.slice(-5).reverse().map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        #{sale.saleNumber.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {sale.items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      Bs {sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
