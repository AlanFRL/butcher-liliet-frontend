import React from 'react';
import { X, Printer, DollarSign, TrendingUp, TrendingDown, Calendar, User, Monitor } from 'lucide-react';
import { Button } from '../ui';
import { ThermalReceipt } from '../ThermalReceipt';

interface CashMovement {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';
  amount: string;
  reason: string | null;
  createdAt: string;
}

interface CashSessionDetailProps {
  session: {
    id: string;
    terminalId: string;
    userId: string;
    openedAt: string;
    closedAt: string | null;
    status: 'OPEN' | 'CLOSED';
    openingAmount: string;
    closingAmount: string | null;
    expectedAmount: string;
    differenceAmount: string | null;
    terminal: {
      id: string;
      name: string;
      location?: string;
    };
    user: {
      id: string;
      fullName: string;
      username: string;
    };
  };
  movements?: CashMovement[];
  sales?: any[];  // Changed to any[] to accept sales with items
  isOpen: boolean;
  onClose: () => void;
}

export const CashSessionDetail: React.FC<CashSessionDetailProps> = ({
  session,
  movements = [],
  sales = [],
  isOpen,
  onClose,
}) => {
  const [showPrintPreview, setShowPrintPreview] = React.useState(false);

  if (!isOpen) return null;

  const openingBalance = parseFloat(session.openingAmount);
  const closingBalance = session.closingAmount ? parseFloat(session.closingAmount) : 0;
  const difference = session.differenceAmount ? parseFloat(session.differenceAmount) : 0;

  // Calcular totales de movimientos
  const totalDeposits = movements
    .filter(m => m.type === 'DEPOSIT')
    .reduce((sum, m) => sum + parseFloat(m.amount), 0);
  
  const totalWithdrawals = movements
    .filter(m => m.type === 'WITHDRAWAL')
    .reduce((sum, m) => sum + parseFloat(m.amount), 0);

  // Calcular ventas por método de pago (solo efectivo y transferencia)
  const cashSales = sales.filter(s => s.paymentMethod === 'CASH');
  const transferSales = sales.filter(s => s.paymentMethod === 'TRANSFER');

  const totalCashSales = cashSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalTransferSales = transferSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalSales = totalCashSales + totalTransferSales;

  const handlePrint = () => {
    console.log('🖨️ Printing cash session:', session.id);
    window.print();
  };

  const handleShowPreview = () => {
    setShowPrintPreview(true);
  };

  // Agregar productos de todas las ventas
  const aggregateProductsSummary = () => {
    const productMap = new Map<string, { quantity: number; unit: string; total: number }>();
    
    sales.forEach((sale) => {
      (sale.items || []).forEach((item: any) => {
        const productName = item.product?.name || item.productName || 'Producto';
        
        // Determinar unidad y cantidad según tipo de producto
        let unit: string;
        let quantity: number;
        
        // Obtener saleType del item o del producto anidado
        const saleType = item.saleType || item.product?.saleType;
        
        // 1. Productos al vacío tienen batchId (inventario por lotes)
        if (item.batchId) {
          unit = 'lote';
          quantity = parseFloat(item.quantity || item.qty || 1);
        }
        // 2. Productos por peso (saleType = WEIGHT, no manejan inventario)
        else if (saleType === 'WEIGHT') {
          unit = 'kg';
          quantity = item.actualWeight ? parseFloat(item.actualWeight) : parseFloat(item.quantity || item.qty || 0);
        }
        // 3. Productos por unidad (saleType = UNIT, manejan inventario)
        else {
          unit = 'unidad';
          quantity = parseFloat(item.quantity || item.qty || 1);
        }
        
        const subtotal = parseFloat(item.subtotal || item.total || 0);
        
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
      quantity: parseFloat(data.quantity.toFixed(3)), // Redondear a 3 decimales
      unit: data.unit,
      total: data.total,
    }));
  };

  return (
    <>
      {!showPrintPreview ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalle de Sesión de Caja</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {session.terminal.name} • {session.user.fullName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Información de la Sesión */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium">
                        {new Date(session.openedAt).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span>
                        {new Date(session.openedAt).toLocaleTimeString('es-BO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {session.closedAt && (
                          <>
                            {' → '}
                            {/* Mostrar fecha de cierre si es diferente del día de apertura */}
                            {new Date(session.closedAt).toLocaleDateString('es-BO', {
                              day: '2-digit',
                              month: 'short',
                            }) !== new Date(session.openedAt).toLocaleDateString('es-BO', {
                              day: '2-digit',
                              month: 'short',
                            }) && (
                              <span className="font-medium">
                                {new Date(session.closedAt).toLocaleDateString('es-BO', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                                {' '}
                              </span>
                            )}
                            {new Date(session.closedAt).toLocaleTimeString('es-BO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium">{session.user.fullName}</span>
                    </div>
                    <div className="flex items-center">
                      <Monitor className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium">{session.terminal.name}</span>
                    </div>
                  </div>
                </div>

                {/* Resumen Financiero */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1 font-medium">Saldo Inicial</p>
                    <p className="text-2xl font-bold text-blue-900">
                      Bs {openingBalance.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                    <p className="text-sm text-green-600 mb-1 font-medium">Total Ventas</p>
                    <p className="text-2xl font-bold text-green-900">
                      Bs {totalSales.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">{sales.length} ventas</p>
                  </div>

                  {session.closedAt && (
                    <>
                      <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                        <p className="text-sm text-purple-600 mb-1 font-medium">Efectivo Contado</p>
                        <p className="text-2xl font-bold text-purple-900">
                          Bs {closingBalance.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className={`rounded-lg p-5 border ${
                        difference > 0 ? 'bg-green-50 border-green-200' :
                        difference < 0 ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`text-sm mb-1 font-medium ${
                          difference > 0 ? 'text-green-600' :
                          difference < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          Diferencia
                        </p>
                        <p className={`text-2xl font-bold ${
                          difference > 0 ? 'text-green-900' :
                          difference < 0 ? 'text-red-900' :
                          'text-gray-900'
                        }`}>
                          {difference > 0 && '+'}Bs {difference.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Movimientos de Caja */}
                {movements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                      Movimientos de Caja
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {totalDeposits > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm text-gray-700">Total Ingresos</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            +Bs {totalDeposits.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {totalWithdrawals > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                            <span className="text-sm text-gray-700">Total Retiros</span>
                          </div>
                          <span className="font-semibold text-red-600">
                            -Bs {totalWithdrawals.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Lista detallada de movimientos */}
                      <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
                        {movements.map(movement => {
                          const amount = parseFloat(movement.amount);
                          const isDeposit = movement.type === 'DEPOSIT';
                          
                          return (
                            <div key={movement.id} className="flex items-start justify-between text-sm">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  {isDeposit ? (
                                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                                  )}
                                  <span className={`font-medium ${
                                    isDeposit ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {movement.type === 'DEPOSIT' ? 'Ingreso' : 
                                     movement.type === 'WITHDRAWAL' ? 'Retiro' : 'Ajuste'}
                                  </span>
                                </div>
                                {movement.reason && (
                                  <p className="text-xs text-gray-500 ml-4">{movement.reason}</p>
                                )}
                                <p className="text-xs text-gray-400 ml-4">
                                  {new Date(movement.createdAt).toLocaleString('es')}
                                </p>
                              </div>
                              <span className={`font-semibold ${
                                isDeposit ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isDeposit ? '+' : '-'}Bs {amount.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ventas por Método de Pago */}
                {sales.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Desglose por Método de Pago
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-600 mb-1">Efectivo</p>
                        <p className="text-xl font-bold text-green-900">
                          Bs {totalCashSales.toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">{cashSales.length} ventas</p>
                      </div>
                      
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <p className="text-sm text-indigo-600 mb-1">Transferencia</p>
                        <p className="text-xl font-bold text-indigo-900">
                          Bs {totalTransferSales.toFixed(2)}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">{transferSales.length} ventas</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              {session.closedAt && (
                <Button
                  onClick={handleShowPreview}
                  variant="primary"
                  className="flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              )}
              <Button onClick={onClose} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Modal de Vista Previa de Impresión
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full max-h-[85vh] flex flex-col">
            <div className="text-center mb-4 no-print">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                <Printer className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">Vista Previa</p>
              <p className="text-sm text-gray-600">Cierre de Caja</p>
            </div>

            <div className="overflow-y-auto flex-1">
              <ThermalReceipt
                printable={true}
                data={{
                  business: 'BUTCHER LILIETH',
                  address: '3er Anillo Interno #123',
                  phone: '62409387',
                  date: session.closedAt ? new Date(session.closedAt).toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : new Date(session.openedAt).toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  cashier: session.user.fullName,
                  openedBy: session.user.fullName,
                  closedBy: session.user.fullName,
                  cashRegister: session.terminal.name,
                  openTime: new Date(session.openedAt).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                  }) + ' ' + new Date(session.openedAt).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  closeTime: session.closedAt ? (
                    new Date(session.closedAt).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                    }) + ' ' + new Date(session.closedAt).toLocaleTimeString('es-BO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  ) : '',
                  initialAmount: openingBalance,
                  productsSummary: aggregateProductsSummary(),
                  salesCount: sales.length,
                  totalSales,
                  totalCashSales,
                  totalTransferSales: totalTransferSales,
                  totalCash: closingBalance,
                  finalAmount: closingBalance,
                  difference,
                }}
              />
            </div>

            <div className="flex space-x-3 mt-4 no-print">
              <Button
                onClick={handlePrint}
                variant="primary"
                size="lg"
                className="flex-1 flex items-center justify-center"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={() => setShowPrintPreview(false)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
