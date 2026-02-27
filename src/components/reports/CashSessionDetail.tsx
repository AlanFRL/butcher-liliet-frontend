import React, { useState } from 'react';
import { X, Printer, DollarSign, TrendingUp, TrendingDown, Calendar, User, Monitor, Receipt, Eye, Package } from 'lucide-react';
import { Button } from '../ui';
import { ThermalReceipt } from '../ThermalReceipt';
import { formatDateBolivia, formatTimeBolivia } from '../../utils/timezone';

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
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'movements' | 'sales' | 'products'>('movements');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  if (!isOpen) return null;
  
  // Debug log
  console.log('📋 CashSessionDetail rendered:', {
    sessionId: session.id,
    movementsCount: movements.length,
    salesCount: sales.length,
    movements: movements,
    sales: sales,
  });

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

  // Calcular ventas por método de pago (solo efectivo y transferencia afectan el arqueo)
  const cashSales = sales.filter(s => s.paymentMethod === 'CASH');
  const transferSales = sales.filter(s => s.paymentMethod === 'TRANSFER');
  const cardSales = sales.filter(s => s.paymentMethod === 'CARD');
  const mixedSales = sales.filter(s => s.paymentMethod === 'MIXED');

  const totalCashSales = cashSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalTransferSales = transferSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalCardSales = cardSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalMixedSales = mixedSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  
  // Total de TODAS las ventas para mostrar
  const totalAllSales = totalCashSales + totalTransferSales + totalCardSales + totalMixedSales;

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

                {/* Resumen Financiero Compacto */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Columna 1: Info de Sesión */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Saldo Inicial</p>
                        <p className="text-lg font-bold text-gray-900">Bs {openingBalance.toFixed(2)}</p>
                      </div>
                      {session.closedAt && (
                        <>
                          <div className="border-t border-gray-100 pt-2.5">
                            <p className="text-xs text-gray-500 mb-0.5">Esperado en Caja</p>
                            <p className="text-lg font-bold text-gray-900">Bs {parseFloat(session.expectedAmount).toFixed(2)}</p>
                          </div>
                          <div className="border-t border-gray-100 pt-2.5">
                            <p className="text-xs text-gray-500 mb-0.5">Contado al Cerrar</p>
                            <p className="text-lg font-bold text-gray-900">Bs {closingBalance.toFixed(2)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Columna 2: Ventas */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Total Ventas</p>
                        <p className="text-lg font-bold text-gray-900">
                          Bs {totalAllSales.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">{sales.length} ventas</p>
                      </div>
                      <div className="border-t border-gray-100 pt-2.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">Efectivo:</span>
                          <span className="text-sm font-semibold text-gray-900">Bs {totalCashSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Transferencia:</span>
                          <span className="text-sm font-semibold text-gray-900">Bs {totalTransferSales.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna 3: Movimientos y Diferencia */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2.5">
                      {(totalDeposits > 0 || totalWithdrawals > 0) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">Movimientos de Caja</p>
                          {totalDeposits > 0 && (
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-green-600">Ingresos:</span>
                              <span className="text-sm font-semibold text-green-600">+Bs {totalDeposits.toFixed(2)}</span>
                            </div>
                          )}
                          {totalWithdrawals > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-red-600">Retiros:</span>
                              <span className="text-sm font-semibold text-red-600">-Bs {totalWithdrawals.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {session.closedAt && (
                        <div className={`border-t border-gray-100 pt-2.5 ${!totalDeposits && !totalWithdrawals ? '' : ''}`}>
                          <p className="text-xs text-gray-500 mb-0.5">Diferencia</p>
                          <p className={`text-xl font-bold ${
                            difference > 0 ? 'text-green-600' :
                            difference < 0 ? 'text-red-600' :
                            'text-gray-900'
                          }`}>
                            {difference > 0 && '+'}Bs {difference.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pestañas */}
                <div className="border-b border-gray-200">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab('movements')}
                      className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'movements'
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Movimientos ({movements.length})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('sales')}
                      className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'sales'
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Receipt className="w-4 h-4 mr-2" />
                        Ventas ({sales.length})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'products'
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Productos
                      </div>
                    </button>
                  </div>
                </div>

                {/* Contenido de las pestañas */}
                {activeTab === 'movements' && (
                  <div className="space-y-4">
                    {/* Resumen de movimientos */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-700 font-medium">Total Ingresos</span>
                          </div>
                          <span className="text-lg font-bold text-green-900">
                            Bs {totalDeposits.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-sm text-red-700 font-medium">Total Retiros</span>
                          </div>
                          <span className="text-lg font-bold text-red-900">
                            Bs {totalWithdrawals.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de movimientos */}
                    {movements.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {movements.map(movement => {
                              const amount = parseFloat(movement.amount);
                              const isDeposit = movement.type === 'DEPOSIT';
                              
                              return (
                                <tr key={movement.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {isDeposit ? (
                                        <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                                      ) : (
                                        <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                                      )}
                                      <span className={`text-sm font-medium ${
                                        isDeposit ? 'text-green-700' : 'text-red-700'
                                      }`}>
                                        {movement.type === 'DEPOSIT' ? 'Ingreso' : 
                                         movement.type === 'WITHDRAWAL' ? 'Retiro' : 'Ajuste'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm text-gray-900">
                                      {movement.reason || '-'}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-sm text-gray-500">
                                      {formatDateBolivia(new Date(movement.createdAt))} {formatTimeBolivia(new Date(movement.createdAt))}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <span className={`text-sm font-bold ${
                                      isDeposit ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {isDeposit ? '+' : '-'}Bs {amount.toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No hay movimientos de caja registrados</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sales' && (
                  <div className="space-y-4">
                    {/* Tabla de ventas */}
                    {sales.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método Pago</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sales.map(sale => (
                              <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm font-mono text-gray-900">
                                    #{sale.id.slice(-8).toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-sm text-gray-900">
                                    {formatDateBolivia(new Date(sale.createdAt))}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatTimeBolivia(new Date(sale.createdAt))}
                                  </p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    sale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                                    sale.paymentMethod === 'TRANSFER' ? 'bg-indigo-100 text-indigo-800' :
                                    sale.paymentMethod === 'CARD' ? 'bg-purple-100 text-purple-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}>
                                    {sale.paymentMethod === 'CASH' ? 'Efectivo' :
                                     sale.paymentMethod === 'TRANSFER' ? 'Transferencia' :
                                     sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Mixto'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <span className="text-sm font-bold text-gray-900">
                                    Bs {parseFloat(sale.total).toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSale(sale);
                                      setShowSaleDetail(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No hay ventas registradas en esta sesión</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {aggregateProductsSummary().map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <span className="text-sm text-gray-900">
                                  {product.quantity} {product.unit}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <span className="text-sm font-bold text-gray-900">
                                  Bs {product.total.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                  totalSales: totalAllSales,
                  totalCashSales,
                  totalTransferSales: totalTransferSales,
                  totalDeposits,
                  totalWithdrawals,
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

      {/* Modal de Detalle de Venta */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Detalle de Venta</h2>
              <button
                onClick={() => {
                  setShowSaleDetail(false);
                  setSelectedSale(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Info general */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">ID de Venta</p>
                      <p className="font-bold text-lg text-gray-900">
                        #{selectedSale.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fecha y Hora</p>
                      <p className="font-semibold text-gray-900">
                        {formatDateBolivia(new Date(selectedSale.createdAt))}
                      </p>
                      <p className="text-gray-600">
                        {formatTimeBolivia(new Date(selectedSale.createdAt))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Método de Pago</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedSale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                        selectedSale.paymentMethod === 'TRANSFER' ? 'bg-indigo-100 text-indigo-800' :
                        selectedSale.paymentMethod === 'CARD' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedSale.paymentMethod === 'CASH' ? 'Efectivo' :
                         selectedSale.paymentMethod === 'TRANSFER' ? 'Transferencia' :
                         selectedSale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Mixto'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">Cajero</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSale.cashier?.fullName || selectedSale.user?.fullName || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Unit</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(selectedSale.items || []).map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">
                                {item.product?.name || item.productName || 'Producto'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              {parseFloat(item.quantity || item.qty || 0).toFixed(3)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              Bs {parseFloat(item.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              Bs {parseFloat(item.subtotal || item.total || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      Bs {parseFloat(selectedSale.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(selectedSale.discount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-semibold text-red-600">
                        -Bs {parseFloat(selectedSale.discount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg border-t border-gray-300 pt-2">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-primary-600">
                      Bs {parseFloat(selectedSale.total).toFixed(2)}
                    </span>
                  </div>
                  {selectedSale.paymentMethod === 'CASH' && parseFloat(selectedSale.changeAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Cambio:</span>
                      <span>Bs {parseFloat(selectedSale.changeAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => {
                  setShowSaleDetail(false);
                  setSelectedSale(null);
                }}
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
