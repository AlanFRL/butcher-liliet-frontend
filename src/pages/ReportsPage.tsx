import React, { useState } from 'react';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useSalesStore, useProductStore } from '../store';

export const ReportsPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const { sales } = useSalesStore();
  const { products } = useProductStore();
  
  // Filtrar ventas por fecha
  const filteredSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt).toISOString().split('T')[0];
    return saleDate >= dateFrom && saleDate <= dateTo && s.status === 'COMPLETED';
  });
  
  // Calcular métricas
  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalTickets = filteredSales.length;
  const averageTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
  
  // Top productos vendidos
  const productSales: Record<string, { name: string; qty: number; total: number; count: number }> = {};
  
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.productName,
          qty: 0,
          total: 0,
          count: 0,
        };
      }
      productSales[item.productId].qty += item.qty;
      productSales[item.productId].total += item.total;
      productSales[item.productId].count += 1;
    });
  });
  
  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  
  // Ventas por día
  const salesByDate: Record<string, { total: number; count: number }> = {};
  
  filteredSales.forEach((sale) => {
    const date = new Date(sale.createdAt).toISOString().split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = { total: 0, count: 0 };
    }
    salesByDate[date].total += sale.total;
    salesByDate[date].count += 1;
  });
  
  const dailySales = Object.entries(salesByDate)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h1>
        <p className="text-gray-600">
          Análisis de ventas y productos
        </p>
      </div>
      
      {/* Filtros de Fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
      
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
            Bs {totalSales.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {totalTickets} tickets
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
            Bs {averageTicket.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Total Tickets</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
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
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay datos de ventas en el período seleccionado
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
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
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.qty.toFixed(2)} unidades · {product.count} ventas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-700">
                        Bs {product.total.toFixed(2)}
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
            {dailySales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay datos de ventas en el período seleccionado
              </p>
            ) : (
              <div className="space-y-3">
                {dailySales.map((day) => {
                  const maxTotal = Math.max(...dailySales.map((d) => d.total));
                  const percentage = (day.total / maxTotal) * 100;
                  
                  return (
                    <div key={day.date} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {new Date(day.date).toLocaleDateString('es', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">
                            Bs {day.total.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({day.count} tickets)
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
    </div>
  );
};
