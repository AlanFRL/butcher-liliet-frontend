import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Receipt, AlertCircle, Printer } from 'lucide-react';
import { Button } from '../components/ui';
import { useCashStore, useSalesStore, useAuthStore } from '../store';
import { ThermalReceipt } from '../components/ThermalReceipt';

export const CashClosePage: React.FC = () => {
  const [countedCash, setCountedCash] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const navigate = useNavigate();
  const { currentSession, cashMovements, closeCashSession, isLoading, error } = useCashStore();
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
  
  // Desglose por método de pago
  const cashSales = sessionSales.filter(s => s.paymentMethod === 'CASH');
  const transferSales = sessionSales.filter(s => s.paymentMethod === 'TRANSFER');
  const cardSales = sessionSales.filter(s => s.paymentMethod === 'CARD');

  const totalCashSales = cashSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransferSales = transferSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalCardSales = cardSales.reduce((sum, sale) => sum + sale.total, 0);
  
  const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = sessionSales.length;
  
  const cashIn = cashMovements
    .filter((m) => m.type === 'DEPOSIT')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const cashOut = cashMovements
    .filter((m) => m.type === 'WITHDRAWAL')
    .reduce((sum, m) => sum + m.amount, 0);
  
  // Efectivo esperado = inicial + ventas en efectivo + ingresos - retiros
  const expectedCash =
    currentSession.openingAmount + totalCashSales + cashIn - cashOut;
  
  const countedCashNum = parseFloat(countedCash) || 0;
  const difference = countedCashNum - expectedCash;
  
  const handleCloseCash = async () => {
    setLocalError('');
    
    if (!countedCash) {
      setLocalError('Debes ingresar el efectivo contado');
      return;
    }
    
    // Llamar al backend para cerrar sesión
    const success = await closeCashSession(countedCashNum, note);
    
    if (success) {
      setShowConfirm(false);
      // Mostrar recibo de cierre
      setShowReceipt(true);
    } else {
      // El error ya está en el store, pero también lo mostramos localmente
      setLocalError(error || 'No se pudo cerrar la sesión');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
          Cerrar Caja
        </h1>
        <p className="text-gray-600 text-center mb-5">
          Realiza el arqueo de caja y finaliza tu turno
        </p>
        
        {/* Resumen del Turno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Información de Apertura */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center text-sm">
              <DollarSign className="w-4 h-4 mr-2 text-gray-600" />
              Información de Apertura
            </h3>
            <div className="space-y-1.5 text-sm">
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
          <div className="bg-blue-50 rounded-lg p-4 md:col-span-2">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Resumen de Ventas del Turno</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">💵 Efectivo:</span>
                  <span className="font-bold text-green-600">
                    Bs {totalCashSales.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{cashSales.length} tickets</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">� Transferencia:</span>
                  <span className="font-bold text-purple-600">
                    Bs {totalTransferSales.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{transferSales.length} tickets</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">💳 Tarjeta:</span>
                  <span className="font-bold text-blue-600">
                    Bs {totalCardSales.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{cardSales.length} tickets</span>
                </div>
              </div>
            </div>
            <div className="border-t border-blue-200 mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">TOTAL VENDIDO:</span>
                <span className="font-bold text-blue-700 text-lg">
                  Bs {totalSales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{salesCount} tickets totales</span>
              </div>
            </div>
          </div>
          
          {/* Movimientos */}
          {(cashIn > 0 || cashOut > 0) && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Movimientos</h3>
              <div className="space-y-1.5 text-sm">
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
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 md:col-span-2">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Arqueo de Efectivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Cálculo del efectivo físico esperado:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efectivo inicial:</span>
                    <span className="font-semibold">Bs {currentSession.openingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">+ Ventas en efectivo:</span>
                    <span className="font-semibold text-green-600">Bs {totalCashSales.toFixed(2)}</span>
                  </div>
                  {cashIn > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">+ Ingresos:</span>
                      <span className="font-semibold text-green-600">Bs {cashIn.toFixed(2)}</span>
                    </div>
                  )}
                  {cashOut > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">- Retiros:</span>
                      <span className="font-semibold text-red-600">Bs {cashOut.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-gray-900">EFECTIVO ESPERADO:</span>
                    <span className="font-bold text-green-700">Bs {expectedCash.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-5xl font-bold text-green-700">
                  Bs {expectedCash.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 No incluye pagos por transferencia ni tarjeta
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Arqueo */}
        <div className="border-t border-gray-200 pt-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Arqueo de Caja
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efectivo Contado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">
                  Bs
                </span>
                <input
                  type="number"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Cuenta el efectivo físico en caja
              </p>
            </div>
            
            {/* Diferencia */}
            {countedCash && (
              <div
                className={`rounded-lg p-4 border-2 ${
                  Math.abs(difference) < 0.01
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Diferencia</h3>
                    <p className="text-xs text-gray-600">
                      {Math.abs(difference) < 0.01
                        ? 'Cuadre perfecto ✓'
                        : difference > 0
                        ? 'Sobrante'
                        : 'Faltante'}
                    </p>
                  </div>
                  <p
                    className={`text-3xl font-bold ${
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
                rows={2}
                placeholder="Explica cualquier diferencia o agrega comentarios sobre el cierre..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
            
            {/* Mensaje de Error */}
            {localError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {localError}
              </div>
            )}
          </div>
        </div>
        
        {/* Botones */}
        <div className="space-y-2 pt-5 border-t border-gray-200 mt-5">
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
                  business: 'BUTCHER LILIETH',
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
