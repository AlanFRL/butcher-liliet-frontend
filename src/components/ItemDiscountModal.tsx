import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, DollarSign, Percent } from 'lucide-react';
import { Button } from './ui';
import type { CartItem } from '../types';

interface ItemDiscountModalProps {
  item: CartItem;
  onClose: () => void;
  onApply: (discount: number) => void;
  onApplyUnitPrice?: (newUnitPrice: number) => void; // Nueva función para cambiar precio/kg
}

export const ItemDiscountModal: React.FC<ItemDiscountModalProps> = ({
  item,
  onClose,
  onApply,
  onApplyUnitPrice,
}) => {
  // Determinar si es producto por peso Y puede cambiar precio
  const isWeightProduct = item.saleType === 'WEIGHT';
  const canChangeUnitPrice = isWeightProduct && !item.scannedBarcode && onApplyUnitPrice;
  
  // Tab activo: 'price' para cambiar precio/kg, 'discount' para descuento
  const [activeTab, setActiveTab] = useState<'price' | 'discount'>(
    canChangeUnitPrice ? 'price' : 'discount'
  );
  
  const [discountInput, setDiscountInput] = useState(item.discount.toFixed(2));
  const [priceInput, setPriceInput] = useState(item.unitPrice.toFixed(2));
  const [error, setError] = useState('');

  const itemSubtotal = item.qty * item.unitPrice;
  const maxDiscount = itemSubtotal;
  
  // Calcular precio original del producto (sin descuento ni ajuste)
  const originalPrice = item.product.price;

  useEffect(() => {
    setDiscountInput(item.discount.toFixed(2));
    setPriceInput(item.unitPrice.toFixed(2));
  }, [item.discount, item.unitPrice]);

  const handleApplyDiscount = () => {
    const discount = parseFloat(discountInput);

    if (isNaN(discount)) {
      setError('Ingrese un monto válido');
      return;
    }

    if (discount < 0) {
      setError('El descuento no puede ser negativo');
      return;
    }

    if (discount > maxDiscount) {
      setError(`El descuento no puede ser mayor a Bs ${maxDiscount.toFixed(2)}`);
      return;
    }

    onApply(discount);
    onClose();
  };
  
  const handleApplyPrice = () => {
    if (!onApplyUnitPrice) return;
    
    const newPrice = parseFloat(priceInput);

    if (isNaN(newPrice)) {
      setError('Ingrese un precio válido');
      return;
    }

    if (newPrice <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    onApplyUnitPrice(newPrice);
    onClose();
  };

  const handleQuickDiscount = (percentage: number) => {
    const discount = (itemSubtotal * percentage) / 100;
    setDiscountInput(discount.toFixed(2));
    setError('');
  };
  
  const handleQuickPriceAdjust = (discountPercentage: number) => {
    const newPrice = originalPrice * (1 - discountPercentage / 100);
    setPriceInput(newPrice.toFixed(2));
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Tag className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              {canChangeUnitPrice ? 'Ajustar Precio o Descuento' : 'Aplicar Descuento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Producto</p>
          <p className="font-semibold text-gray-900">{item.productName}</p>
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-600">
              {item.qty.toFixed(3)} {item.unit} × Bs {item.unitPrice.toFixed(2)}
            </span>
            <span className="font-semibold text-gray-900">
              Bs {itemSubtotal.toFixed(2)}
            </span>
          </div>
          {item.scannedBarcode && (
            <div className="mt-2 text-xs text-amber-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Producto de balanza - precio fijo
            </div>
          )}
        </div>
        
        {/* Tabs (solo si puede cambiar precio) */}
        {canChangeUnitPrice && (
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => {
                setActiveTab('price');
                setError('');
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'price'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Ajustar Precio/Kg
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('discount');
                setError('');
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'discount'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center">
                <Percent className="w-4 h-4 mr-1" />
                Descuento en Bs
              </div>
            </button>
          </div>
        )}
        
        {/* Contenido según tab activo */}
        {activeTab === 'price' && canChangeUnitPrice ? (
          <>
            {/* Info precio original */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700 mb-1">Precio original del producto:</p>
              <p className="text-lg font-bold text-blue-900">Bs {originalPrice.toFixed(2)}/kg</p>
            </div>
            
            {/* Botones rápidos de ajuste */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Descuentos Rápidos</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => handleQuickPriceAdjust(percentage)}
                    className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    -{percentage}%
                  </button>
                ))}
              </div>
            </div>

            {/* Input de nuevo precio */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo Precio por {item.unit} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  Bs
                </span>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    setError('');
                  }}
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el nuevo precio por kilogramo
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Cantidad</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.qty.toFixed(3)} {item.unit}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Nuevo Precio/Kg</span>
                <span className="text-sm font-medium text-blue-600">
                  Bs {(parseFloat(priceInput) || 0).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Nuevo Total</span>
                  <span className="text-lg font-bold text-blue-700">
                    Bs {(item.qty * (parseFloat(priceInput) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              {parseFloat(priceInput) < originalPrice && (
                <div className="mt-2 text-xs text-green-700">
                  Ahorro: Bs {((originalPrice - parseFloat(priceInput)) * item.qty).toFixed(2)}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Quick Discount Buttons */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Descuentos Rápidos</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => handleQuickDiscount(percentage)}
                    className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto de Descuento <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  Bs
                </span>
                <input
                  type="number"
                  value={discountInput}
                  onChange={(e) => {
                    setDiscountInput(e.target.value);
                    setError('');
                  }}
                  step="0.01"
                  min="0"
                  max={maxDiscount}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus={!canChangeUnitPrice}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Máximo: Bs {maxDiscount.toFixed(2)}
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">
                  Bs {itemSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Descuento</span>
                <span className="text-sm font-medium text-red-600">
                  -Bs {(parseFloat(discountInput) || 0).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-green-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Nuevo Total</span>
                  <span className="text-lg font-bold text-green-700">
                    Bs {Math.max(0, itemSubtotal - (parseFloat(discountInput) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={activeTab === 'price' ? handleApplyPrice : handleApplyDiscount} 
            variant="primary" 
            className="flex-1"
          >
            {activeTab === 'price' ? 'Aplicar Precio' : 'Aplicar Descuento'}
          </Button>
        </div>
      </div>
    </div>
  );
};
