import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Receipt, AlertCircle, Printer } from 'lucide-react';
import { Button } from '../components/ui';
import { useCashStore, useSalesStore, useAuthStore } from '../store';
import { ThermalReceipt } from '../components/ThermalReceipt';

export const CashClosePage: React.FC = () => {
  const [countedCash, setCountedCash] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const navigate = useNavigate();
  const { currentSession, cashMovements, closeCashSession } = useCashStore();
  const { sales } = useSalesStore();
  const { currentUser } = useAuthStore();
  
  // Si no hay caja abierta
  if (!currentSession || currentSession.status !== 'OPEN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            No hay caja abierta
          </h2>
          <p className="text-yellow-700 mb-4">
            No puedes cerrar una caja que no está abierta
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Calcular totales
  const sessionSales = sales.filter(
    (s) => s.cashSessionId === currentSession.id && s.status === 'COMPLETED'
  );
  
  const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = sessionSales.length;
  
  const cashIn = cashMovements
    .filter((m) => m.type === 'IN')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const cashOut = cashMovements
    .filter((m) => m.type === 'OUT')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const expectedCash =
    currentSession.openingAmount + totalSales + cashIn - cashOut;
  
  const countedCashNum = parseFloat(countedCash) || 0;
  const difference = countedCashNum - expectedCash;
  
  const handleCloseCash = async () => {
    if (!countedCash) {
      alert('Debes ingresar el efectivo contado');
      return;
    }
    
    setIsLoading(true);
    
    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    closeCashSession(countedCashNum, note);
    
    setIsLoading(false);
    setShowConfirm(false);
    
    // Navegar al dashboard
    navigate('/dashboard');
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Receipt className="w-10 h-10 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Cerrar Caja
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Realiza el arqueo de caja y finaliza tu turno
        </p>
        
        {/* Resumen del Turno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Información de Apertura */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
              Información de Apertura
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Hora apertura:</span>
                <span className="font-semibold">
                  {new Date(currentSession.openedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto inicial:</span>
                <span className="font-semibold text-green-600">
                  Bs {currentSession.openingAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Resumen de Ventas */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Resumen de Ventas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total ventas:</span>
                <span className="font-semibold text-blue-600">
                  Bs {totalSales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets:</span>
                <span className="font-semibold">{salesCount}</span>
              </div>
            </div>
          </div>
          
          {/* Movimientos */}
          {(cashIn > 0 || cashOut > 0) && (
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Movimientos</h3>
              <div className="space-y-2">
                {cashIn > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos:</span>
                    <span className="font-semibold text-green-600">
                      +Bs {cashIn.toFixed(2)}
                    </span>
                  </div>
                )}
                {cashOut > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retiros:</span>
                    <span className="font-semibold text-red-600">
                      -Bs {cashOut.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Efectivo Esperado */}
          <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <h3 className="font-bold text-gray-900 mb-4">Efectivo Esperado</h3>
            <p className="text-4xl font-bold text-green-700">
              Bs {expectedCash.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Arqueo */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Arqueo de Caja
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efectivo Contado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-2xl font-bold">
                  Bs
                </span>
                <input
                  type="number"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-16 pr-4 py-4 text-3xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Cuenta el efectivo físico en caja
              </p>
            </div>
            
            {/* Diferencia */}
            {countedCash && (
              <div
                className={`rounded-lg p-6 border-2 ${
                  Math.abs(difference) < 0.01
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Diferencia</h3>
                    <p className="text-sm text-gray-600">
                      {Math.abs(difference) < 0.01
                        ? 'Cuadre perfecto ✓'
                        : difference > 0
                        ? 'Sobrante'
                        : 'Faltante'}
                    </p>
                  </div>
                  <p
                    className={`text-4xl font-bold ${
                      Math.abs(difference) < 0.01
                        ? 'text-green-700'
                        : difference > 0
                        ? 'text-blue-700'
                        : 'text-red-700'
                    }`}
                  >
                    {difference >= 0 ? '+' : ''}Bs {difference.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Nota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones {Math.abs(difference) > 0.01 && '(Obligatorio)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Explica cualquier diferencia o agrega comentarios sobre el cierre..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required={Math.abs(difference) > 0.01}
              />
            </div>
            
            {/* Advertencia si hay diferencia */}
            {Math.abs(difference) > 0.01 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">
                    Atención: Hay una diferencia de caja
                  </p>
                  <p className="text-sm text-yellow-700">
                    Debes explicar el motivo de la diferencia antes de cerrar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Botones */}
        <div className="space-y-3 pt-8 border-t border-gray-200 mt-8">
          <Button
            onClick={() => setShowReceipt(true)}
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center"
          >
            <Printer className="w-5 h-5 mr-2" />
            Vista Previa Reporte Z
          </Button>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!countedCash || (Math.abs(difference) > 0.01 && !note)}
              variant="danger"
              size="lg"
              className="flex-1"
            >
              Cerrar Caja
            </Button>
          </div>
        </div>
      </div>
      
      {/* Confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              ¿Confirmar cierre de caja?
            </h3>
            <p className="text-gray-600 mb-6">
              Una vez cerrada la caja, no podrás realizar más ventas en esta sesión.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCloseCash}
                variant="danger"
                size="lg"
                className="flex-1"
                isLoading={isLoading}
              >
                Sí, Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Reporte Térmico */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Reporte de Cierre Z
              </h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <ThermalReceipt
                data={{
                  business: 'CARNICERÍA PREMIUM LILIETH',
                  address: 'Av. Principal #123, La Paz',
                  phone: '+591 2-1234567',
                  date: new Date().toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  cashier: currentUser?.username || 'Usuario',
                  terminal: 'Terminal 1',
                  openTime: new Date(currentSession!.openedAt).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  closeTime: new Date().toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  initialAmount: currentSession!.openingAmount,
                  sales: sessionSales.map((sale) => ({
                    id: sale.id,
                    time: new Date(sale.createdAt).toLocaleTimeString('es-BO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    total: sale.total,
                    items: sale.items.length,
                  })),
                  totalSales,
                  totalCash: countedCashNum,
                  finalAmount: currentSession!.openingAmount + totalSales,
                  difference,
                }}
              />
            </div>
            
            <div className="mt-4 flex space-x-3">
              <Button
                onClick={() => setShowReceipt(false)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                onClick={() => window.print()}
                variant="primary"
                size="lg"
                className="flex-1 flex items-center justify-center"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
