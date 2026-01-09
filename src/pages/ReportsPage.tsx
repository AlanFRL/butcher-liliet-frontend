import React, { useState } from 'react';
import { BarChart3, TrendingUp, Package, DollarSign, Eye, Receipt } from 'lucide-react';
import { Button, Modal } from '../components/ui';
import { useSalesStore, useProductStore } from '../store';
import type { Sale } from '../types';

export const ReportsPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'summary' | 'sales'>('summary');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  
  const { sales } = useSalesStore();
  const { } = useProductStore();
  
  // Filtrar ventas por fecha
  const filteredSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt).toISOString().split('T')[0];
    return saleDate >= dateFrom && saleDate <= dateTo && s.status === 'COMPLETED';
  });
  
  // Ordenar ventas por fecha (más reciente primero)
  const sortedSales = [...filteredSales].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleDetailModal(true);
  };
  
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Ventas</h1>
        <p className="text-gray-600">
          Análisis de ventas, productos e historial
        </p>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewMode('summary')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              viewMode === 'summary'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline-block mr-2" />
            Resumen y Análisis
          </button>
          <button
            onClick={() => setViewMode('sales')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              viewMode === 'sales'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Receipt className="w-5 h-5 inline-block mr-2" />
            Historial de Ventas
          </button>
        </div>
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
      {viewMode === 'summary' && (
        <>
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
      </>
      )}
      
      {/* Historial de Ventas */}
      {viewMode === 'sales' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-primary-600" />
              Historial de Ventas
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({sortedSales.length} ventas)
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            {sortedSales.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay ventas en el período seleccionado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      # Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900">
                          #{sale.saleNumber.toString().padStart(6, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(sale.createdAt).toLocaleDateString('es', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' '}
                        {new Date(sale.createdAt).toLocaleTimeString('es', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-bold text-primary-700">
                          Bs {Math.round(sale.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          onClick={() => handleViewSale(sale)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          isOpen={showSaleDetailModal}
          onClose={() => {
            setShowSaleDetailModal(false);
            setSelectedSale(null);
          }}
        />
      )}
    </div>
  );
};

// Modal de Detalle de Venta
const SaleDetailModal: React.FC<{
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
}> = ({ sale, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Venta" size="lg">
      <div className="space-y-6">
        {/* Info de la Venta */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Número de Venta</p>
              <p className="font-bold text-lg text-gray-900">
                #{sale.saleNumber.toString().padStart(6, '0')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Fecha y Hora</p>
              <p className="font-semibold text-gray-900">
                {new Date(sale.createdAt).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-gray-600">
                {new Date(sale.createdAt).toLocaleTimeString('es', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Items de la Venta */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                    Cantidad
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Precio Unit.
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.saleType === 'WEIGHT' && (
                        <p className="text-xs text-gray-500">Por peso</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">
                      {item.saleType === 'WEIGHT' ? item.qty.toFixed(3) : item.qty}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      Bs {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      Bs {Math.round(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="border-t-2 border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold">Bs {Math.round(sale.subtotal)}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Descuento:</span>
                <span className="font-semibold text-red-600">
                  -Bs {Math.round(sale.discountTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-primary-700 pt-2 border-t border-gray-200">
              <span>TOTAL:</span>
              <span>Bs {Math.round(sale.total)}</span>
            </div>
          </div>
        </div>

        {sale.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm font-medium text-yellow-900">Notas:</p>
            <p className="text-sm text-yellow-800">{sale.notes}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
