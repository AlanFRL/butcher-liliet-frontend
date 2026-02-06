import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Receipt, DollarSign } from 'lucide-react';
import { useSalesStore, useOrderStore, useAuthStore } from '../store';
import { salesApi } from '../services/api';
import type { PaginatedResponse, SaleResponse } from '../services/api';
import { SalesSummaryTab } from '../components/reports/SalesSummaryTab';
import { SalesHistoryTab } from '../components/reports/SalesHistoryTab';
import { CashHistoryTab } from '../components/reports/CashHistoryTab';
import { formatDateForInput, validateDateRange, getNowBolivia, formatDateForBackend } from '../utils/timezone';

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

type TabId = 'summary' | 'sales' | 'cash';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const tabs: Tab[] = [
  { id: 'summary', name: 'Resumen', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { id: 'sales', name: 'Ventas', icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
  { id: 'cash', name: 'Cajas', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
];

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [dateFrom, setDateFrom] = useState(
    formatDateForInput(getNowBolivia())
  );
  const [dateTo, setDateTo] = useState(
    formatDateForInput(getNowBolivia())
  );
  const [dateError, setDateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [statistics, setStatistics] = useState<SalesStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendSales, setBackendSales] = useState<any[]>([]);
  
  // Estado de paginación para ventas
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(25);
  const [salesTotalItems, setSalesTotalItems] = useState(0);
  const [salesTotalPages, setSalesTotalPages] = useState(0);
  
  const { sales } = useSalesStore();
  const { orders } = useOrderStore();
  
  // Filtrar tabs según rol del usuario
  const visibleTabs = tabs.filter(tab => tab.roles.includes(currentUser?.role || ''));
  
  // Ajustar tab activa si el usuario no tiene acceso
  useEffect(() => {
    if (!visibleTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'summary');
    }
  }, [currentUser?.role]);
  
  // Validar rango de fechas cuando cambian
  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    
    if (!validateDateRange(dateFrom, dateTo)) {
      setDateError('La fecha "hasta" no puede ser anterior a la fecha "desde"');
      return;
    }
    
    // Validar rango máximo de 90 días
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) {
      setDateError('El rango máximo permitido es de 90 días. Por favor selecciona un período menor.');
      return;
    }
    
    // Advertencia si el rango es mayor a 30 días
    if (diffDays > 30) {
      setDateError(`⚠️ Rango grande (${diffDays} días). La carga puede ser lenta.`);
    } else {
      setDateError(null);
    }
    
    // Resetear paginación al cambiar fechas
    setSalesPage(1);
  }, [dateFrom, dateTo]);
  
  // Cargar estadísticas y ventas desde el backend solo si fechas son válidas
  useEffect(() => {
    // No cargar si hay error crítico (no es solo advertencia)
    const hasCriticalError = dateError && !dateError.includes('⚠️');
    if ((activeTab === 'summary' || activeTab === 'sales') && !hasCriticalError) {
      loadStatistics();
      loadSales();
    }
  }, [dateFrom, dateTo, activeTab, dateError, salesPage, salesPageSize]);
  
  const loadStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await salesApi.getStatistics({
        startDate: formatDateForBackend(dateFrom, false), // Inicio del día
        endDate: formatDateForBackend(dateTo, true), // Fin del día
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
      const params = {
        startDate: formatDateForBackend(dateFrom, false),
        endDate: formatDateForBackend(dateTo, true),
        page: salesPage,
        limit: salesPageSize,
      };
      
      console.log('🔍 Requesting sales with params:', JSON.stringify(params, null, 2));
      
      const salesData = await salesApi.getAll(params);
      
      console.log('📦 Sales response type:', Array.isArray(salesData) ? 'Array' : 'Object with data');
      console.log('📦 Sales response:', salesData);
      
      // Verificar si la respuesta es paginada
      if ('data' in salesData) {
        const paginatedResponse = salesData as PaginatedResponse<SaleResponse>;
        console.log('✅ Paginated response detected:', paginatedResponse.data.length, 'of', paginatedResponse.total, 'total');
        setBackendSales(paginatedResponse.data);
        setSalesTotalItems(paginatedResponse.total);
        setSalesTotalPages(paginatedResponse.totalPages);
      } else {
        // Backward compatibility: respuesta sin paginar (array directo)
        const salesArray = salesData as SaleResponse[];
        console.log('⚠️ Non-paginated array response:', salesArray.length, 'items');
        setBackendSales(salesArray);
        setSalesTotalItems(salesArray.length);
        setSalesTotalPages(1);
      }
    } catch (error) {
      console.error('❌ Error loading sales:', error);
    }
  };
  
  // Usar ventas del backend (ya vienen paginadas y filtradas) o localStorage como fallback
  const filteredSales = backendSales.length > 0 
    ? backendSales // Ya vienen filtradas y paginadas del backend
    : sales.filter((s) => {
        const saleDate = new Date(s.createdAt).toISOString().split('T')[0];
        return saleDate >= dateFrom && saleDate <= dateTo && s.status === 'COMPLETED';
      });
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h1>
        <p className="text-gray-600">
          Análisis de ventas, productos e historial de cajas
        </p>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 inline-block mr-2" />
                {tab.name}
              </button>
            );
          })}
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
              max={dateTo}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                dateError && !dateError.includes('⚠️')
                  ? 'border-red-500 focus:ring-red-500' 
                  : dateError && dateError.includes('⚠️')
                  ? 'border-yellow-500 focus:ring-yellow-500'
                  : 'border-gray-300 focus:ring-primary-500'
              }`}
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
              min={dateFrom}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                dateError && !dateError.includes('⚠️')
                  ? 'border-red-500 focus:ring-red-500' 
                  : dateError && dateError.includes('⚠️')
                  ? 'border-yellow-500 focus:ring-yellow-500'
                  : 'border-gray-300 focus:ring-primary-500'
              }`}
            />
          </div>
        </div>
        
        {/* Mensaje de error/advertencia */}
        {dateError && (
          <div className={`mt-3 text-sm flex items-center gap-2 ${
            dateError.includes('⚠️') ? 'text-yellow-600' : 'text-red-600'
          }`}>
            <span className="font-semibold">{dateError.includes('⚠️') ? '⚠️' : '⚠️'}</span>
            <span>{dateError}</span>
          </div>
        )}
      </div>
      
      {/* Contenido de tabs */}
      {activeTab === 'summary' && (
        <SalesSummaryTab
          statistics={statistics}
          isLoading={isLoading}
          error={error}
        />
      )}
      
      {activeTab === 'sales' && (
        <SalesHistoryTab
          sales={filteredSales}
          orders={orders}
          navigate={navigate}
          // Props de paginación
          currentPage={salesPage}
          totalPages={salesTotalPages}
          totalItems={salesTotalItems}
          pageSize={salesPageSize}
          onPageChange={(page) => setSalesPage(page)}
          onPageSizeChange={(size) => {
            setSalesPageSize(size);
            setSalesPage(1); // Resetear a página 1 al cambiar tamaño
          }}
        />
      )}
      
      {activeTab === 'cash' && (
        <CashHistoryTab
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </div>
  );
};
