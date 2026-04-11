import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, AlertCircle, Eye, Printer } from 'lucide-react';
import { Button } from '../components/ui';
import { useCashStore, useSalesStore, useAuthStore, useAppStore } from '../store';
import { ThermalReceipt } from '../components/ThermalReceipt';

export const CashClosePage: React.FC = () => {
  const [countedCash, setCountedCash] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [localError, setLocalError] = useState('');
  const [closedSessionSnapshot, setClosedSessionSnapshot] = useState<any>(null);
  
  const navigate = useNavigate();
  const { currentSession, cashMovements, closeCashSession, isLoading, error } = useCashStore();
  const { sales } = useSalesStore();
  const { currentUser } = useAuthStore();
  const { terminals } = useAppStore();
  
  // Helper para obtener nombre de usuario formateado
  const getUserDisplayName = (user: { fullName?: string; username?: string } | undefined | null): string => {
    if (!user) return 'Usuario';
    if (user.fullName) return user.fullName;
    if (user.username) {
      // Capitalizar username: "administrador" -> "Administrador"
      return user.username.charAt(0).toUpperCase() + user.username.slice(1);
    }
    return 'Usuario';
  };
  
  // Helper para agregar productos de todas las ventas en un resumen
  const aggregateProductsSummary = (salesList: any[]) => {
    const productMap = new Map<string, { quantity: number; unit: string; total: number }>();
    
    salesList.forEach((sale) => {
      sale.items.forEach((item: any) => {
        const productName = item.productName;
        
        // Determinar unidad y cantidad según tipo de producto
        let unit: string;
        let quantity: number;
        
        // 1. Productos al vacío tienen batchId (inventario por lotes)
        if (item.batchId) {
          unit = 'lote';
          quantity = item.qty || 1;
        }
        // 2. Productos por peso (saleType = WEIGHT, no manejan inventario)
        else if (item.saleType === 'WEIGHT') {
          unit = 'kg';
          quantity = item.actualWeight ? parseFloat(item.actualWeight) : item.qty;
        }
        // 3. Productos por unidad (saleType = UNIT, manejan inventario)
        else {
          unit = 'unidad';
          quantity = item.qty || 1;
        }
        
        const subtotal = item.total;
        
        if (productMap.has(productName)) {
          const existing = productMap.get(productName)!;
          existing.quantity += quantity;
          existing.total += subtotal;
          // Actualizar unidad si cambia (priorizar kg > lote > unidad)
          if (unit === 'kg' && existing.unit !== 'kg') {
            existing.unit = 'kg';
          } else if (unit === 'lote' && existing.unit === 'unidad') {
            existing.unit = 'lote';
          }
        } else {
          productMap.set(productName, { quantity, unit, total: subtotal });
        }
      });
    });
    
    return Array.from(productMap.entries()).map(([productName, data]) => ({
      productName,
      quantity: Number(Number(data.quantity).toFixed(3)), // Redondear a 3 decimales asegurando tipo número
      unit: data.unit,
      total: Number(data.total),
    }));
  };
  
  // Si no hay caja abierta Y no hay reporte que mostrar
  if ((!currentSession || currentSession.status !== 'OPEN') && !showReceipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            No hay caja abierta
          </h2>
          <p className="text-yellow-700 mb-4">
            No puedes cerrar una caja que no está abierta
          </p>
          <Button onClick={() => navigate('/cash')} variant="primary">
            Volver a Caja
          </Button>
        </div>
      </div>
    );
  }
  
  // Calcular totales
  const sessionSales = currentSession ? sales.filter(
    (s) => s.cashSessionId === currentSession.id && s.status === 'COMPLETED'
  ) : [];
  
  // Desglose por método de pago (solo efectivo y transferencia)
  const cashSales = sessionSales.filter(s => s.paymentMethod === 'CASH');
  const transferSales = sessionSales.filter(s => s.paymentMethod === 'TRANSFER');
  const mixedSales = sessionSales.filter(s => s.paymentMethod === 'MIXED');

  const pureCashTotal = cashSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const mixedCashTotal = mixedSales.reduce((sum, sale) => sum + Number(sale.cashAmount || 0), 0);
  const totalCashSales = pureCashTotal + mixedCashTotal;

  const pureTransferTotal = transferSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const mixedTransferTotal = mixedSales.reduce((sum, sale) => sum + Number(sale.transferAmount || 0), 0);
  const totalTransferSales = pureTransferTotal + mixedTransferTotal;
  
  const totalSales = sessionSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const salesCount = sessionSales.length;
  
  const cashIn = cashMovements
    .filter((m) => m.type === 'DEPOSIT')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  
  const cashOut = cashMovements
    .filter((m) => m.type === 'WITHDRAWAL')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  
  // Convertir openingAmount a número explícitamente para evitar problemas si viene como string
  const openingAmountNum = currentSession ? Number(currentSession.openingAmount || 0) : 0;
  
  // Efectivo esperado = inicial + ventas en efectivo + ingresos - retiros
  const expectedCash = currentSession
    ? openingAmountNum + totalCashSales + cashIn - cashOut
    : 0;
  
  const countedCashNum = parseFloat(countedCash) || 0;
  const difference = countedCashNum - expectedCash;
  
  const handleShowPreview = () => {
    setLocalError('');
    
    if (!countedCash) {
      setLocalError('Debes ingresar el efectivo contado');
      return;
    }
    
    setShowPreview(true);
  };
  
  const handleCloseCash = async () => {
    setLocalError('');
    
    if (!countedCash) {
      setLocalError('Debes ingresar el efectivo contado');
      return;
    }
    
    // Guardar snapshot ANTES de cerrar
    const snapshot = {
      session: currentSession!,
      user: currentSession!.user,
      productsSummary: aggregateProductsSummary(sessionSales),
      salesCount: sessionSales.length,
      terminal: terminals.find(t => t.id === currentSession!.terminalId),
      totals: { totalSales, totalCashSales, totalTransferSales },
      cashIn,
      cashOut,
      countedCash: countedCashNum,
      difference,
    };
    
    // Llamar al backend para cerrar sesión
    const success = await closeCashSession(countedCashNum, note);
    
    if (success) {
      setClosedSessionSnapshot(snapshot);
      setShowConfirm(false);
      setShowReceipt(true);
    } else {
      // El error ya está en el store, pero también lo mostramos localmente
      setLocalError(error || 'No se pudo cerrar la sesión');
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
        {/* Header Compacto */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <Receipt className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Cerrar Caja
            </h1>
            <p className="text-sm text-gray-600">
              Realiza el arqueo de caja y finaliza tu turno
            </p>
          </div>
        </div>
        
        {/* Resumen del Turno - Compacto */}
        {currentSession && (
        <div className="space-y-3 mb-4">
          {/* Card único con toda la info financiera */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 mb-3">
              {/* Columna 1: Info Básica */}
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Apertura</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(currentSession.openedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo Inicial</p>
                  <p className="text-lg font-bold text-gray-900">
                    Bs {openingAmountNum.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Columna 2: Ventas */}
              <div className="space-y-2 border-l border-gray-200 pl-4">
                <div>
                  <p className="text-sm text-gray-500">Total Ventas</p>
                  <p className="text-lg font-bold text-blue-600">
                    Bs {totalSales.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">{salesCount} tickets</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">💵 Efectivo:</span>
                    <span className="font-semibold text-gray-900 ml-1">Bs {totalCashSales.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">📱 Transfer:</span>
                    <span className="font-semibold text-gray-900 ml-1">Bs {totalTransferSales.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Columna 3: Efectivo Esperado */}
              <div className="border-l border-gray-200 pl-4">
                <p className="text-sm text-gray-500 mb-1">Efectivo Esperado en Caja</p>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  Bs {expectedCash.toFixed(2)}
                </p>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Inicial:</span>
                    <span className="font-medium">Bs {openingAmountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Efectivo:</span>
                    <span className="font-medium text-green-600">Bs {totalCashSales.toFixed(2)}</span>
                  </div>
                  {cashIn > 0 && (
                    <div className="flex justify-between">
                      <span>+ Ingresos:</span>
                      <span className="font-medium text-green-600">Bs {cashIn.toFixed(2)}</span>
                    </div>
                  )}
                  {cashOut > 0 && (
                    <div className="flex justify-between">
                      <span>- Retiros:</span>
                      <span className="font-medium text-red-600">Bs {cashOut.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Nota informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm text-blue-700">
              💡 El efectivo esperado NO incluye pagos por transferencia
            </div>
          </div>
        </div>
        )}
        
        {/* Arqueo - Compacto */}
        {currentSession && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Arqueo de Caja
          </h2>
          
          {/* Fila única con Efectivo y Observaciones lado a lado */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Columna 1: Efectivo Contado */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Efectivo Contado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
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
            </div>
            
            {/* Columna 2: Observaciones */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Observaciones {Math.abs(difference) > 0.01 && <span className="text-gray-500 text-sm">(Recomendado)</span>}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explica cualquier diferencia o agrega comentarios..."
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                style={{ height: '68px' }}
              />
            </div>
          </div>
          
          {/* Diferencia - Debajo si hay efectivo contado */}
          {countedCash && (
            <div className={`rounded-lg p-4 border-2 text-center ${
              Math.abs(difference) < 0.01
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {Math.abs(difference) < 0.01
                      ? '✓ Cuadre Perfecto'
                      : difference > 0
                      ? '⚠️ Sobrante'
                      : '⚠️ Faltante'}
                  </p>
                  <p className={`text-4xl font-bold ${
                    Math.abs(difference) < 0.01
                      ? 'text-green-700'
                      : difference > 0
                      ? 'text-blue-700'
                      : 'text-red-700'
                  }`}>
                    {difference >= 0 ? '+' : ''}Bs {difference.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Diferencia</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Advertencia compacta debajo */}
          
          {/* Advertencias compactas */}
          {Math.abs(difference) > 0.01 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">
                  Hay una diferencia de caja ({difference >= 0 ? '+' : ''}Bs {difference.toFixed(2)})
                </p>
              </div>
            </div>
          )}
          
          {localError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {localError}
            </div>
          )}
        </div>
        )}
        
        {/* Botones */}
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={() => navigate('/cash')}
            variant="outline"
            size="md"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleShowPreview}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Vista Previa
          </Button>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!countedCash}
            variant="danger"
            size="md"
            className="flex-1"
          >
            Cerrar Caja
          </Button>
        </div>
      </div>
      
      {/* Modal Vista Previa ANTES de cerrar */}
      {showPreview && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full my-8">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="text-xl font-bold text-gray-900">
                Vista Previa - Cierre de Caja
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <ThermalReceipt
                printable={true}
                data={{
                  business: 'BUTCHER LILIETH',
                  address: '3er Anillo Interno #123',
                  phone: '62409387',
                  date: new Date().toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  cashier: getUserDisplayName(currentUser),
                  openedBy: getUserDisplayName(currentSession.user),
                  closedBy: getUserDisplayName(currentUser),
                  cashRegister: terminals.find(t => t.id === currentSession.terminalId)?.name || 'Caja Principal',
                  openTime: new Date(currentSession.openedAt).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                  }) + ' ' + new Date(currentSession.openedAt).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  closeTime: new Date().toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                  }) + ' ' + new Date().toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  initialAmount: currentSession.openingAmount,
                  productsSummary: aggregateProductsSummary(sessionSales),
                  salesCount: sessionSales.length,
                  totalSales,
                  totalCashSales,
                  totalTransferSales,
                  totalDeposits: cashIn,
                  totalWithdrawals: cashOut,
                  totalCash: countedCashNum,
                  finalAmount: currentSession.openingAmount + totalSales,
                  difference,
                }}
              />
            </div>
            
            <div className="flex space-x-3 mt-4 no-print">
              <Button
                onClick={() => window.print()}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Cerrar Caja
                </h3>
                <p className="text-sm text-gray-500">
                  Esta acción es definitiva
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Efectivo contado:</span>
                <span className="text-base font-bold">Bs {countedCashNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Esperado:</span>
                <span className="text-base font-bold">Bs {expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">Diferencia:</span>
                <span className={`text-lg font-bold ${
                  Math.abs(difference) < 0.01 ? 'text-green-600' :
                  difference > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {difference >= 0 ? '+' : ''}Bs {difference.toFixed(2)}
                </span>
              </div>
            </div>
            
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
                Confirmar Cierre
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Reporte Térmico */}
      {showReceipt && closedSessionSnapshot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full my-8">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="text-xl font-bold text-gray-900">
                ¡Cierre de Caja Exitoso!
              </h3>
              <button
                onClick={() => { setShowReceipt(false); navigate('/cash'); }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <ThermalReceipt
                printable={true}
                data={{
                  business: 'BUTCHER LILIETH',
                  address: '3er Anillo Interno #123',
                  phone: '62409387',
                  date: new Date().toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  cashier: getUserDisplayName(currentUser),
                  openedBy: getUserDisplayName(closedSessionSnapshot.user),
                  closedBy: getUserDisplayName(currentUser),
                  cashRegister: closedSessionSnapshot.terminal?.name || 'Caja Principal',
                  openTime: new Date(closedSessionSnapshot.session.openedAt).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                  }) + ' ' + new Date(closedSessionSnapshot.session.openedAt).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  closeTime: new Date().toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                  }) + ' ' + new Date().toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  initialAmount: closedSessionSnapshot.session.openingAmount,
                  productsSummary: closedSessionSnapshot.productsSummary,
                  salesCount: closedSessionSnapshot.salesCount,
                  totalSales: closedSessionSnapshot.totals.totalSales,
                  totalCashSales: closedSessionSnapshot.totals.totalCashSales,
                  totalTransferSales: closedSessionSnapshot.totals.totalTransferSales,
                  totalDeposits: closedSessionSnapshot.cashIn,
                  totalWithdrawals: closedSessionSnapshot.cashOut,
                  totalCash: closedSessionSnapshot.countedCash,
                  finalAmount: closedSessionSnapshot.session.openingAmount + closedSessionSnapshot.totals.totalSales,
                  difference: closedSessionSnapshot.difference,
                }}
              />
            </div>
            
            <div className="flex space-x-3 mt-4 no-print">
              <Button
                onClick={() => window.print()}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={() => { setShowReceipt(false); navigate('/cash'); }}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Ir a Caja
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
