import React from 'react';
import { Modal, Button } from '../ui';
import type { CartItem } from '../../types';

interface POSPaymentModalProps {
  isOpen: boolean;
  cartItems: CartItem[];
  cartTotal: number;
  cartSubtotal: number;
  itemDiscountsTotal: number;
  globalDiscount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  cashPaid: string;
  change: number;
  cashPaidNum: number;
  canCompleteSale: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onSetGlobalDiscount: (value: number) => void;
  onSetPaymentMethod: (method: 'CASH' | 'TRANSFER' | 'CARD') => void;
  onSetCashPaid: (value: string) => void;
  onConfirm: () => void;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  isOpen,
  cartItems,
  cartTotal,
  cartSubtotal,
  itemDiscountsTotal,
  globalDiscount,
  paymentMethod,
  cashPaid,
  change,
  cashPaidNum,
  canCompleteSale,
  isProcessing = false,
  onClose,
  onSetGlobalDiscount,
  onSetPaymentMethod,
  onSetCashPaid,
  onConfirm,
}) => {
  // Calcular el máximo de descuento adicional: subtotal DESPUÉS de descuentos de items
  const maxAdditionalDiscount = Math.round(cartSubtotal - itemDiscountsTotal);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Procesar Pago"
      size="xl"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Columna Izquierda: Resumen de Venta */}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-gray-700 mb-3">Resumen de Venta</h3>
          <div className="bg-gray-50 rounded-lg p-3 flex-1 overflow-y-auto" style={{ maxHeight: '28rem' }}>
            <div className="space-y-2">
              {cartItems.map((item) => {
                // Diferenciar descuento de sobrecarga:
                // DESCUENTO: effectiveUnitPrice < unitPrice → Mostrar precio sistema + descuento separado
                // SOBRECARGA: effectiveUnitPrice > unitPrice → Mostrar precio efectivo (sin descuento)
                const hasEffectivePrice = item.effectiveUnitPrice !== undefined;
                const isDiscount = hasEffectivePrice && item.effectiveUnitPrice! < item.unitPrice;
                
                // Para DESCUENTOS: mostrar precio del sistema
                // Para SOBRECARGAS: mostrar precio efectivo
                const displayUnitPrice = isDiscount ? item.unitPrice : (item.effectiveUnitPrice || item.unitPrice);
                
                const itemSubtotalBeforeDiscount = Math.round(item.qty * item.unitPrice); // Precio sistema
                const itemActualSubtotal = Math.round(item.qty * displayUnitPrice);
                const itemDiscount = item.discount || 0;
                
                return (
                  <div key={item.id} className="text-sm border-b border-gray-200 pb-2 last:border-b-0">
                    <div className="font-medium text-gray-900 mb-1">{item.product.name}</div>
                    <div className="flex justify-between text-gray-600">
                      <span>
                        {item.product.saleType === 'WEIGHT' ? (
                          // Productos por peso: peso × precio/kg
                          `${item.qty.toFixed(3)} kg × Bs ${Math.round(displayUnitPrice)}/kg`
                        ) : (
                          // Productos por unidad: qty × precio
                          `${item.qty} unid × Bs ${Math.round(displayUnitPrice)}`
                        )}
                      </span>
                      <span className="font-semibold">Bs {Math.round(itemActualSubtotal)}</span>
                    </div>
                    {itemDiscount > 0 && (
                      <div className="flex justify-between text-xs text-red-600 mt-1 ml-2">
                        <span>Descuento</span>
                        <span>-Bs {Math.round(itemDiscount)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Columna Derecha: Formulario */}
        <div className="flex flex-col space-y-4">
          {/* Descuento Global (opcional) - Compacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descuento Adicional <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                Bs
              </span>
              <input
                type="number"
                value={Math.round(globalDiscount)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  onSetGlobalDiscount(value);
                }}
                step="0.01"
                min="0"
                max={maxAdditionalDiscount}
                className="w-full pl-10 pr-3 py-2 text-base font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Máximo: Bs {maxAdditionalDiscount}
            </p>
          </div>
          
          {/* Resumen de totales - Compacto */}
          <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                Bs {Math.round(cartSubtotal)}
              </span>
            </div>
            {itemDiscountsTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desc. en items</span>
                <span className="font-semibold text-red-600">
                  -Bs {Math.round(itemDiscountsTotal)}
                </span>
              </div>
            )}
            {globalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desc. adicional</span>
                <span className="font-semibold text-red-600">
                  -Bs {Math.round(globalDiscount)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-1.5 mt-1.5">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-700">Total a Cobrar</span>
                <span className="text-xl font-bold text-primary-700">
                  Bs {cartTotal}
                </span>
              </div>
            </div>
          </div>
          
          {/* Método de Pago - Compacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSetPaymentMethod('CASH')}
                className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Efectivo
              </button>
              <button
                onClick={() => onSetPaymentMethod('TRANSFER')}
                className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Transferencia
              </button>
            </div>
          </div>
          
          {/* Pago en Efectivo - Compacto */}
          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Efectivo Recibido
              </label>
              <input
                type="number"
                value={cashPaid}
                onChange={(e) => onSetCashPaid(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              
              {change >= 0 && cashPaidNum > 0 && (
                <div className="mt-3 bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700 mb-0.5">Cambio</p>
                  <p className="text-2xl font-bold text-green-700">
                    Bs {change}
                  </p>
                </div>
              )}
              
              {change < 0 && cashPaidNum > 0 && (
                <div className="mt-3 bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    Efectivo insuficiente. Faltan Bs {Math.abs(change)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Botones de Acción - Compacto */}
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              size="md"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!canCompleteSale || isProcessing}
              variant="success"
              size="md"
              className="flex-1"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
