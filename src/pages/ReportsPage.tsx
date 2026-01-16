import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Package, DollarSign, Eye, Receipt } from 'lucide-react';
import { Button, Modal } from '../components/ui';
import { useSalesStore, useOrderStore } from '../store';
import { salesApi } from '../services/api';
import type { Sale } from '../types';

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

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'summary' | 'sales'>('summary');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [statistics, setStatistics] = useState<SalesStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendSales, setBackendSales] = useState<any[]>([]);
  
  const { sales } = useSalesStore();
  const { orders } = useOrderStore();
  
  // Cargar estadísticas y ventas desde el backend
  useEffect(() => {
    loadStatistics();
    loadSales();
  }, [dateFrom, dateTo]);
  
  const loadStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await salesApi.getStatistics({
        startDate: dateFrom,
        endDate: dateTo,
      });
      console.log('📊 Statistics loaded:', JSON.stringify(stats, null, 2));
      setStatistics(stats);
    } catch (error) {
      console.error('❌ Error loading statistics:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const salesData = await salesApi.getAll({
        startDate: dateFrom,
        endDate: dateTo,
      });
      console.log('📋 Sales loaded:', salesData.length);
      setBackendSales(salesData);
    } catch (error) {
      console.error('❌ Error loading sales:', error);
    }
  };
  
  // Usar ventas del backend si están disponibles, sino usar localStorage
  const filteredSales = backendSales.length > 0 
    ? backendSales.filter((s) => s.status === 'COMPLETED')
    : sales.filter((s) => {
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
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando estadísticas...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : statistics ? (
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
                          {new Date(day.date).toLocaleDateString('es', {
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
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">No hay estadísticas disponibles</div>
          </div>
        )}
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
                  {sortedSales.map((sale) => {
                    // Manejar tanto ventas del backend como del localStorage
                    const saleId = sale.id;
                    const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
                    const itemCount = sale.items?.length || 0;
                    
                    return (
                    <tr key={saleId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900">
                          #{saleId.slice(-8).toUpperCase()}
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
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-bold text-primary-700">
                          Bs {total.toFixed(2)}
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
                    );
                  })}
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
          orders={orders}
          navigate={navigate}
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
  sale: any; // Acepta tanto Sale del store como SaleResponse del backend
  orders: any[];
  navigate: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ sale, orders, navigate, isOpen, onClose }) => {
  // Convertir valores string del backend a números
  const subtotal = typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : sale.subtotal;
  const discount = typeof sale.discount === 'string' ? parseFloat(sale.discount) : sale.discount;
  const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
  const changeAmount = sale.changeAmount ? (typeof sale.changeAmount === 'string' ? parseFloat(sale.changeAmount) : sale.changeAmount) : 0;
  
  // Buscar el pedido asociado
  const relatedOrder = sale.orderId ? orders.find(o => o.id === sale.orderId) : null;
  
  const handleViewOrder = () => {
    if (relatedOrder) {
      // Navegar a pedidos y abrir el detalle (pasando el orderId como state)
      navigate('/orders', { state: { openOrderId: relatedOrder.id } });
      onClose();
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Venta" size="lg">
      <div className="space-y-6">
        {/* Link al pedido si existe */}
        {relatedOrder && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Esta venta proviene de un pedido</p>
                <p className="text-xs text-blue-700">Pedido #{relatedOrder.orderNumber}</p>
              </div>
              <Button
                onClick={handleViewOrder}
                variant="outline"
                size="sm"
              >
                Ver Pedido
              </Button>
            </div>
          </div>
        )}
        
        {/* Info de la Venta */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">ID de Venta</p>
              <p className="font-bold text-lg text-gray-900">
                #{sale.id.slice(-8).toUpperCase()}
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
                {sale.items?.map((item: any) => {
                  const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.qty || item.quantity);
                  const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
                  const itemTotal = typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : (item.total || item.subtotal);
                  const actualWeight = item.actualWeight ? (typeof item.actualWeight === 'string' ? parseFloat(item.actualWeight) : item.actualWeight) : null;
                  
                  return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.batchNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Lote: {item.batchNumber}
                          {actualWeight && ` (${actualWeight.toFixed(3)}kg)`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">
                      {qty.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      Bs {unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      Bs {itemTotal.toFixed(2)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="border-t-2 border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold">Bs {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Descuento:</span>
                <span className="font-semibold text-red-600">
                  -Bs {discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-primary-700 pt-2 border-t border-gray-200">
              <span>TOTAL:</span>
              <span>Bs {total.toFixed(2)}</span>
            </div>
            {changeAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Cambio:</span>
                <span className="font-semibold">Bs {changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mostrar notas solo si existen y no son el orderId automático */}
        {sale.notes && !sale.notes.includes('Pedido #') && (
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
