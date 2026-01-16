import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Plus, Minus, Receipt, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { useCashStore, useSalesStore, useAuthStore } from '../store';

export const CashPage: React.FC = () => {
  const { currentSession, cashMovements } = useCashStore();
  const { sales } = useSalesStore();
  const { currentUser } = useAuthStore();
  
  // Calcular totales de la sesión actual
  const sessionSales = currentSession
    ? sales.filter(
        (s) => s.cashSessionId === currentSession.id && s.status === 'COMPLETED'
      )
    : [];
  
  const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = sessionSales.length;
  
  const cashIn = cashMovements
    .filter((m) => m.type === 'DEPOSIT')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const cashOut = cashMovements
    .filter((m) => m.type === 'WITHDRAWAL')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const expectedCash = currentSession
    ? currentSession.openingAmount + totalSales + cashIn - cashOut
    : 0;
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Caja
        </h1>
        <p className="text-gray-600">
          Administra tu turno, movimientos y arqueo
        </p>
      </div>
      
      {/* Estado de Caja */}
      <div className="mb-8">
        {currentSession?.status === 'OPEN' ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-green-900">
                    Caja Abierta
                  </h2>
                  <p className="text-green-700">
                    Sesión iniciada a las {new Date(currentSession.openedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Link to="/cash/close">
                <Button variant="danger" size="lg">
                  <Receipt className="w-5 h-5 mr-2" />
                  Cerrar Caja
                </Button>
              </Link>
            </div>
            
            {/* Resumen Actual */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Monto Inicial</p>
                <p className="text-2xl font-bold text-gray-900">
                  Bs {currentSession.openingAmount.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Ventas</p>
                <p className="text-2xl font-bold text-green-600">
                  Bs {totalSales.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{salesCount} tickets</p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Movimientos</p>
                <p className="text-lg font-bold text-gray-900">
                  <span className="text-green-600">+Bs {cashIn.toFixed(2)}</span>
                  {' / '}
                  <span className="text-red-600">-Bs {cashOut.toFixed(2)}</span>
                </p>
              </div>
              
              <div className="bg-primary-50 border-2 border-primary-300 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Efectivo Esperado</p>
                <p className="text-2xl font-bold text-primary-700">
                  Bs {expectedCash.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-orange-900">
                    Caja Cerrada
                  </h2>
                  <p className="text-orange-700">
                    No hay una sesión activa. Abre caja para comenzar a operar.
                  </p>
                </div>
              </div>
              {['ADMIN', 'CASHIER', 'MANAGER'].includes(currentUser?.role || '') && (
                <Link to="/cash/open">
                  <Button variant="success" size="lg">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Abrir Caja
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Acciones Rápidas */}
      {currentSession?.status === 'OPEN' && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Movimientos de Efectivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Ingreso de Efectivo</h3>
                  <p className="text-sm text-gray-600">
                    Registrar entrada de dinero (depósito, corrección, etc.)
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Función disponible próximamente
              </p>
              <Button variant="outline" className="w-full" disabled>
                Registrar Ingreso
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Minus className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Retiro de Efectivo</h3>
                  <p className="text-sm text-gray-600">
                    Registrar salida de dinero (banco, gastos, etc.)
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Función disponible próximamente
              </p>
              <Button variant="outline" className="w-full" disabled>
                Registrar Retiro
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Movimientos Recientes */}
      {currentSession && cashMovements.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Movimientos de Esta Sesión
          </h2>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cashMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          movement.type === 'DEPOSIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {movement.type === 'DEPOSIT' ? 'Ingreso' : 'Retiro'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                      <span
                        className={
                          movement.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {movement.type === 'DEPOSIT' ? '+' : '-'}Bs {movement.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Información */}
      {!currentSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Consejo:</strong> La gestión de caja te permite controlar el efectivo de tu turno.
            Abre caja al iniciar tu jornada, registra movimientos si es necesario, y cierra al finalizar
            para realizar el arqueo.
          </p>
        </div>
      )}
    </div>
  );
};
