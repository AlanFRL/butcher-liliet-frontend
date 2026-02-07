import React, { useState } from 'react';
import { Receipt, Eye, Printer } from 'lucide-react';
import { Button } from '../ui';
import Pagination from '../ui/Pagination';
import { PrintableSaleReceipt } from '../PrintableSaleReceipt';
import { formatDateBolivia, formatTimeBolivia } from '../../utils/timezone';

interface SalesHistoryTabProps {
  sales: any[];
  orders: any[];
  navigate: any;
  // Props de paginación
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const SalesHistoryTab: React.FC<SalesHistoryTabProps> = ({
  sales,
  orders,
  navigate,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);

  // Ordenar ventas por fecha (más reciente primero)
  const sortedSales = [...sales].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleViewSale = (sale: any) => {
    console.log('👁️ Ver detalle de venta:', sale);
    setSelectedSale(sale);
    setShowSaleDetailModal(true);
  };

  return (
    <>
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

        {/* Paginación superior */}
        {totalPages > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        )}

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
                        {formatDateBolivia(new Date(sale.createdAt), {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' '}
                        {formatTimeBolivia(new Date(sale.createdAt))}
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

        {/* Paginación inferior */}
        {totalPages > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <>
          <SaleDetailModal
            sale={selectedSale}
            orders={orders}
            navigate={navigate}
            isOpen={showSaleDetailModal}
            onClose={() => {
              setShowSaleDetailModal(false);
              setSelectedSale(null);
            }}
            onPrint={() => {
              console.log('🖨️ [SalesHistoryTab] onPrint triggered');
              window.print();
            }}
          />
          
          {showPrintPreviewModal && (
            <PrintPreviewModal
              sale={selectedSale}
              isOpen={showPrintPreviewModal}
              onClose={() => {
                setShowPrintPreviewModal(false);
                setShowSaleDetailModal(true);
              }}
              onPrint={() => {
                console.log('🖨️ [SalesHistoryTab] onPrint from preview');
                window.print();
              }}
            />
          )}
        </>
      )}
    </>
  );
};

// Modal de Detalle de Venta
const SaleDetailModal: React.FC<{
  sale: any;
  orders: any[];
  navigate: any;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}> = ({ sale, orders, navigate, isOpen, onClose, onPrint }) => {
  const subtotal = typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : sale.subtotal;
  const discount = typeof sale.discount === 'string' ? parseFloat(sale.discount) : sale.discount;
  const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
  const changeAmount = sale.changeAmount ? (typeof sale.changeAmount === 'string' ? parseFloat(sale.changeAmount) : sale.changeAmount) : 0;
  
  const relatedOrder = sale.orderId ? orders.find(o => o.id === sale.orderId) : null;
  
  const getCashierName = () => {
    if (sale.cashier?.fullName) return sale.cashier.fullName;
    if (sale.user?.fullName) return sale.user.fullName;
    if (sale.cashierName) return sale.cashierName;
    return 'N/A';
  };
  
  const handleViewOrder = () => {
    if (relatedOrder) {
      navigate('/orders', { state: { openOrderId: relatedOrder.id } });
      onClose();
    }
  };
  
  const handlePrint = () => {
    console.log('🖨️ [SaleDetailModal] handlePrint clicked');
    onPrint();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Detalle de Venta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="print:hidden">
            <div className="space-y-6">
              {relatedOrder && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Esta venta proviene de un pedido</p>
                      <p className="text-xs text-blue-700">Pedido #{relatedOrder.orderNumber}</p>
                    </div>
                    <Button onClick={handleViewOrder} variant="outline" size="sm">
                      Ver Pedido
                    </Button>
                  </div>
                </div>
              )}
              
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

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Cantidad</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Precio Unit.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sale.items?.map((item: any) => {
                        const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.qty || item.quantity);
                        const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
                        const itemTotal = typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : (item.total || item.subtotal);
                        const itemDiscount = item.discount ? (typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount) : 0;
                        const actualWeight = item.actualWeight ? (typeof item.actualWeight === 'string' ? parseFloat(item.actualWeight) : item.actualWeight) : null;
                        const itemSubtotalBeforeDiscount = Math.round(qty * unitPrice);
                        
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              {item.batchNumber && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Lote: {item.batchNumber}
                                  {actualWeight && ` (Peso real: ${actualWeight.toFixed(3)} kg)`}
                                </p>
                              )}
                              {itemDiscount > 0 && (
                                <p className="text-xs text-red-600 mt-1 font-semibold">
                                  Descuento: -Bs {itemDiscount.toFixed(2)}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900">
                              {item.unit === 'kg' ? qty.toFixed(3) : qty.toFixed(0)} {item.unit || 'unid'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              Bs {unitPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="font-semibold text-gray-900">
                                Bs {itemSubtotalBeforeDiscount}
                              </p>
                              {itemDiscount > 0 && (
                                <p className="text-xs text-gray-500">
                                  (Final: Bs {Math.round(itemTotal)})
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">Bs {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Descuento:</span>
                      <span className="font-semibold text-red-600">-Bs {discount.toFixed(2)}</span>
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

              {sale.notes && !sale.notes.includes('Pedido #') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-900">Notas:</p>
                  <p className="text-sm text-yellow-800">{sale.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button onClick={handlePrint} variant="primary" className="flex items-center">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={onClose} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="hidden">
          <PrintableSaleReceipt
            printable={true}
            data={{
              saleId: sale.id,
              date: new Date(sale.createdAt).toLocaleDateString('es-BO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }),
              time: new Date(sale.createdAt).toLocaleTimeString('es-BO', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              cashier: getCashierName(),
              items: sale.items?.map((item: any) => {
                const qty = item.quantity !== undefined 
                  ? (typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity)
                  : 0;
                const unitPrice = item.unitPrice !== undefined
                  ? (typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice)
                  : 0;
                const itemTotal = item.subtotal !== undefined
                  ? (typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal)
                  : 0;
                const itemDiscount = item.discount 
                  ? (typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount)
                  : 0;
                
                return {
                  name: item.productName || 'Producto',
                  quantity: qty,
                  unit: item.unit || 'unid',
                  price: unitPrice,
                  subtotal: itemTotal,
                  discount: itemDiscount,
                  batchNumber: item.batchNumber,
                  actualWeight: item.actualWeight 
                    ? (typeof item.actualWeight === 'string' ? parseFloat(item.actualWeight) : item.actualWeight) 
                    : undefined,
                };
              }) || [],
              subtotal,
              discount: discount || 0,
              total,
              paymentMethod: sale.paymentMethod,
              cashPaid: sale.cashAmount ? (typeof sale.cashAmount === 'string' ? parseFloat(sale.cashAmount) : sale.cashAmount) : undefined,
              change: changeAmount || undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Modal de Vista Previa de Impresión
const PrintPreviewModal: React.FC<{
  sale: any;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}> = ({ sale, isOpen, onClose, onPrint }) => {
  if (!isOpen) return null;

  const subtotal = typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : sale.subtotal;
  const discount = typeof sale.discount === 'string' ? parseFloat(sale.discount) : sale.discount;
  const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
  const changeAmount = sale.changeAmount ? (typeof sale.changeAmount === 'string' ? parseFloat(sale.changeAmount) : sale.changeAmount) : 0;

  const getCashierName = () => {
    if (sale.cashier?.fullName) return sale.cashier.fullName;
    if (sale.user?.fullName) return sale.user.fullName;
    if (sale.cashierName) return sale.cashierName;
    return 'N/A';
  };

  const handlePrintReceipt = () => {
    console.log('🖨️ [PrintPreviewModal] handlePrintReceipt called');
    onPrint();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full max-h-[85vh] flex flex-col">
        <div className="text-center mb-4 no-print">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
            <Printer className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">Vista Previa</p>
          <p className="text-sm text-gray-600">Nota de Venta #{sale.id.slice(-8).toUpperCase()}</p>
        </div>

        <div className="overflow-y-auto flex-1">
          <PrintableSaleReceipt
            printable={true}
            data={{
              saleId: sale.id,
              date: new Date(sale.createdAt).toLocaleDateString('es-BO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }),
              time: new Date(sale.createdAt).toLocaleTimeString('es-BO', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              cashier: getCashierName(),
              items: sale.items?.map((item: any) => {
                const qty = item.quantity !== undefined 
                  ? (typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity)
                  : 0;
                const unitPrice = item.unitPrice !== undefined
                  ? (typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice)
                  : 0;
                const itemTotal = item.subtotal !== undefined
                  ? (typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal)
                  : 0;
                const itemDiscount = item.discount 
                  ? (typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount)
                  : 0;
                
                return {
                  name: item.productName || 'Producto',
                  quantity: qty,
                  unit: item.unit || 'unid',
                  price: unitPrice,
                  subtotal: itemTotal,
                  discount: itemDiscount,
                  batchNumber: item.batchNumber,
                  actualWeight: item.actualWeight 
                    ? (typeof item.actualWeight === 'string' ? parseFloat(item.actualWeight) : item.actualWeight) 
                    : undefined,
                };
              }) || [],
              subtotal,
              discount: discount || 0,
              total,
              paymentMethod: sale.paymentMethod,
              cashPaid: sale.cashAmount ? (typeof sale.cashAmount === 'string' ? parseFloat(sale.cashAmount) : sale.cashAmount) : undefined,
              change: changeAmount || undefined,
            }}
          />
        </div>

        <div className="flex space-x-3 mt-4 no-print">
          <Button onClick={handlePrintReceipt} variant="primary" size="lg" className="flex-1 flex items-center justify-center">
            <Printer className="w-5 h-5 mr-2" />
            Imprimir
          </Button>
          <Button onClick={onClose} variant="outline" size="lg" className="flex-1">
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
};
