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
  onClose,
  onSetGlobalDiscount,
  onSetPaymentMethod,
  onSetCashPaid,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Procesar Pago"
      size="md"
    >
      <div className="space-y-6">
        {/* Resumen de items para la nota de venta */}
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de Venta</h3>
          <div className="space-y-2">
            {cartItems.map((item) => {
              const itemSubtotalBeforeDiscount = Math.round(item.qty * item.unitPrice);
              const itemDiscount = item.discount || 0;
              
              return (
                <div key={item.id} className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">{item.product.name}</div>
                  <div className="flex justify-between text-gray-600">
                    <span>
                      {item.product.saleType === 'WEIGHT' ? (
                        // Productos por peso: peso × precio/kg
                        `${item.qty.toFixed(3)} kg × Bs ${Math.round(item.unitPrice)}/kg`
                      ) : (
                        // Productos por unidad: qty × precio
                        `${item.qty} unid × Bs ${Math.round(item.unitPrice)}`
                      )}
                    </span>
                    <span className="font-semibold">Bs {Math.round(itemSubtotalBeforeDiscount)}</span>
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
        
        {/* Descuento Global (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descuento Adicional <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
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
              max={cartSubtotal}
              className="w-full pl-12 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Máximo: Bs {Math.round(cartSubtotal)}
          </p>
        </div>
        
        {/* Resumen de totales */}
        <div className="space-y-2 bg-gray-50 rounded-lg p-4">
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
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-700">Total a Cobrar</span>
              <span className="text-2xl font-bold text-primary-700">
                Bs {cartTotal}
              </span>
            </div>
          </div>
        </div>
        
        {/* Método de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSetPaymentMethod('CASH')}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Efectivo
            </button>
            <button
              onClick={() => onSetPaymentMethod('TRANSFER')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                paymentMethod === 'TRANSFER'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Transferencia
            </button>
          </div>
        </div>
        
        {/* Pago en Efectivo */}
        {paymentMethod === 'CASH' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Efectivo Recibido
            </label>
            <input
              type="number"
              value={cashPaid}
              onChange={(e) => onSetCashPaid(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
            
            {change >= 0 && cashPaidNum > 0 && (
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700 mb-1">Cambio</p>
                <p className="text-3xl font-bold text-green-700">
                  Bs {change}
                </p>
              </div>
            )}
            
            {change < 0 && cashPaidNum > 0 && (
              <div className="mt-4 bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Efectivo insuficiente. Faltan Bs {Math.abs(change)}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Botones de Acción */}
        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canCompleteSale}
            variant="success"
            size="lg"
            className="flex-1"
          >
            Confirmar Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
};
