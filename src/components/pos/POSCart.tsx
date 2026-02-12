import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Tag } from 'lucide-react';
import { Button } from '../ui';
import CustomerSelector from '../CustomerSelector';
import { type CustomerResponse } from '../../services/api';
import type { CartItem } from '../../types';

interface POSCartProps {
  cartItems: CartItem[];
  cartTotal: number;
  cartSubtotal: number;
  itemDiscountsTotal: number;
  selectedCustomer: CustomerResponse | null;
  onSelectedCustomerChange: (customer: CustomerResponse | null) => void;
  onClearCart: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItemQty: (itemId: string, qty: number) => void;
  onQtyInputChange: (itemId: string, value: string) => void;
  onQtyInputBlur: (itemId: string, saleType: 'UNIT' | 'WEIGHT') => void;
  onOpenDiscountModal: (item: CartItem) => void;
  onCheckout: () => void;
  getInputValue: (itemId: string, qty: number, saleType: 'UNIT' | 'WEIGHT') => string;
}

export const POSCart: React.FC<POSCartProps> = ({
  cartItems,
  cartTotal,
  cartSubtotal,
  itemDiscountsTotal,
  selectedCustomer,
  onSelectedCustomerChange,
  onClearCart,
  onRemoveItem,
  onUpdateItemQty,
  onQtyInputChange,
  onQtyInputBlur,
  onOpenDiscountModal,
  onCheckout,
  getInputValue,
}) => {
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header del Carrito */}
      <div className="p-4 border-b border-gray-200 bg-primary-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2 text-primary-600" />
            Carrito
          </h2>
          <div className="flex items-center space-x-2">
            {cartItems.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpiar
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">{cartItems.length} items</p>
      </div>
      
      {/* Cliente (opcional) */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Cliente (Opcional)</h3>
        <CustomerSelector
          value={selectedCustomer}
          onChange={onSelectedCustomerChange}
          placeholder="Buscar cliente..."
          className="text-sm"
        />
      </div>
      
      {/* Items del Carrito */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">El carrito está vacío</p>
          </div>
        ) : (
          cartItems.map((item) => {
            // Contar cuántos items hay del mismo producto
            const sameProductItems = cartItems.filter(i => i.productId === item.productId);
            const itemIndex = sameProductItems.findIndex(i => i.id === item.id) + 1;
            const showCounter = sameProductItems.length > 1;
            
            return (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {item.productName}
                    </h4>
                    {showCounter && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                        #{itemIndex}
                      </span>
                    )}
                    {item.scannedBarcode && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                        📟 Escaneado
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Si es producto escaneado, no permitir cambiar cantidad */}
              {item.scannedBarcode ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {`${item.qty.toFixed(3)} ${item.product.unit}`}
                      {/* Mostrar precio por kg para productos escaneados */}
                      {item.scannedBarcode && item.product.saleType === 'WEIGHT' && (() => {
                        // DESCUENTO: mostrar precio sistema, SOBRECARGA: mostrar precio efectivo
                        const hasEffectivePrice = item.effectiveUnitPrice !== undefined;
                        const isDiscount = hasEffectivePrice && item.effectiveUnitPrice! < item.unitPrice;
                        const displayPrice = isDiscount ? item.unitPrice : (item.effectiveUnitPrice || item.unitPrice);
                        return (
                          <span className="text-xs text-gray-500 block mt-1">
                            Bs {Math.round(displayPrice)}/{item.product.unit}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      {item.discount > 0 ? (
                        <>
                          <p className="text-xs text-gray-400 line-through">
                            Bs {Math.round(item.qty * item.unitPrice)}
                          </p>
                          <p className="text-lg font-bold text-primary-700">
                            Bs {Math.round(item.total)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-primary-700">
                          Bs {Math.round(item.total)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Botón de descuento y visualización */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => onOpenDiscountModal(item)}
                      className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {item.discount > 0 ? 'Modificar desc.' : 'Aplicar desc.'}
                    </button>
                    {item.discount > 0 && (
                      <span className={`text-xs font-semibold ${
                        item.discountAutoDetected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.discountAutoDetected && '🎉 '}Descuento: -Bs {Math.round(item.discount)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const step = item.product.saleType === 'UNIT' ? 1 : 0.5;
                          const newQty = item.qty - step;
                          if (newQty > 0) onUpdateItemQty(item.id, newQty);
                        }}
                        className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    <input
                      type="text"
                      value={getInputValue(item.id, item.qty, item.product.saleType)}
                      onChange={(e) => onQtyInputChange(item.id, e.target.value)}
                      onBlur={() => onQtyInputBlur(item.id, item.product.saleType)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-16 text-center border border-gray-300 rounded py-1 font-medium"
                    />
                    <button
                      onClick={() => {
                        const step = item.product.saleType === 'UNIT' ? 1 : 0.5;
                        const newQty = item.qty + step;
                        
                        // Verificar stock para productos por unidad
                        if (item.product.saleType === 'UNIT' && item.product.stockUnits !== undefined) {
                          if (newQty > item.product.stockUnits) {
                            alert(`Stock insuficiente. Solo hay ${item.product.stockUnits} unidades disponibles`);
                            return;
                          }
                        }
                        
                        onUpdateItemQty(item.id, newQty);
                      }}
                      className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500">{item.product.unit}</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {(() => {
                        // DESCUENTO: mostrar precio sistema, SOBRECARGA: mostrar precio efectivo
                        const hasEffectivePrice = item.effectiveUnitPrice !== undefined;
                        const isDiscount = hasEffectivePrice && item.effectiveUnitPrice! < item.unitPrice;
                        const displayPrice = isDiscount ? item.unitPrice : (item.effectiveUnitPrice || item.unitPrice);
                        return `Bs ${Math.round(displayPrice)}/${item.product.unit}`;
                      })()}
                    </p>
                    {item.discount > 0 ? (
                      <>
                        <p className="text-xs text-gray-400 line-through">
                          Bs {Math.round(item.qty * item.unitPrice)}
                        </p>
                        <p className="text-lg font-bold text-primary-700">
                          Bs {Math.round(item.total)}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-primary-700">
                        Bs {Math.round(item.total)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Botón de descuento y visualización */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => onOpenDiscountModal(item)}
                    className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {item.discount > 0 ? 'Modificar desc.' : 'Aplicar desc.'}
                  </button>
                  {item.discount > 0 && (
                    <span className={`text-xs font-semibold ${
                      item.discountAutoDetected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.discountAutoDetected && '🎉 '}Descuento: -Bs {Math.round(item.discount)}
                    </span>
                  )}
                </div>
              </div>
              )}
            </div>
            );
          })
        )}
      </div>
      
      {/* Total y Pagar */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="mb-4">
          {itemDiscountsTotal > 0 && (
            <>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                <span>Subtotal:</span>
                <span>Bs {Math.round(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-red-600 mb-2">
                <span>Desc. items:</span>
                <span>-Bs {Math.round(itemDiscountsTotal)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center text-2xl font-bold">
            <span className="text-gray-900">TOTAL:</span>
            <span className="text-primary-700">Bs {Math.round(cartTotal)}</span>
          </div>
        </div>
        
        <Button
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          variant="primary"
          size="xl"
          className="w-full"
        >
          <ShoppingCart className="w-6 h-6 mr-2" />
          Proceder al Pago
        </Button>
      </div>
    </div>
  );
};
