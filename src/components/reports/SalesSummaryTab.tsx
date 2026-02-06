import React from 'react';
import { DollarSign, TrendingUp, BarChart3, Package } from 'lucide-react';
import { formatDateBolivia } from '../../utils/timezone';

interface SalesStatistics {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalDiscount: number;
    averageTicket: number;
    cancelledSales: number;
  };
  paymentMethods: {
    cash: { count: number; total: number };
    card: { count: number; total: number };
    transfer: { count: number; total: number };
    mixed: { count: number; total: number };
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    revenue: number;
    salesCount: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    salesCount: number;
  }>;
}

interface SalesSummaryTabProps {
  statistics: SalesStatistics | null;
  isLoading: boolean;
  error: string | null;
}

export const SalesSummaryTab: React.FC<SalesSummaryTabProps> = ({
  statistics,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No hay estadísticas disponibles</div>
      </div>
    );
  }

  return (
    <>
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Total Ventas</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            Bs {statistics.summary.totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {statistics.summary.totalSales} tickets
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Ticket Promedio</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            Bs {statistics.summary.averageTicket.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Total Tickets</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statistics.summary.totalSales}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary-600" />
              Top 10 Productos
            </h2>
          </div>
          <div className="p-6">
            {statistics.topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay datos de ventas en el período seleccionado
              </p>
            ) : (
              <div className="space-y-3">
                {statistics.topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-primary-700">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity.toFixed(2)} unidades · {product.salesCount} ventas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-700">
                        Bs {product.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Ventas por Día */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
              Ventas por Día
            </h2>
          </div>
          <div className="p-6">
            {statistics.dailySales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay datos de ventas en el período seleccionado
              </p>
            ) : (
              <div className="space-y-3">
                {statistics.dailySales.map((day) => {
                  const maxTotal = Math.max(...statistics.dailySales.map((d) => d.revenue));
                  const percentage = (day.revenue / maxTotal) * 100;
                  
                  return (
                    <div key={day.date} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {formatDateBolivia(new Date(day.date.includes('T') ? day.date : day.date + 'T12:00:00'), {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">
                            Bs {day.revenue.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({day.salesCount} tickets)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
