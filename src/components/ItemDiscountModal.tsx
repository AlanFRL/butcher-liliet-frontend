import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from './ui';
import type { CartItem } from '../types';

interface ItemDiscountModalProps {
  item: CartItem;
  onClose: () => void;
  onApplyUnitPrice: (newUnitPrice: number) => void;
}

export const ItemDiscountModal: React.FC<ItemDiscountModalProps> = ({
  item,
  onClose,
  onApplyUnitPrice,
}) => {
  // Para productos con lote, calcular precio efectivo por kg
  const isProductWithBatch = (item.batchId || item.needsBatchCreation) && item.actualWeight;
  const effectivePricePerKg = isProductWithBatch 
    ? Math.floor(item.unitPrice / item.actualWeight!)
    : item.unitPrice;
  
  const [newUnitPrice, setNewUnitPrice] = useState(effectivePricePerKg.toFixed(0));
  const [error, setError] = useState('');

  const originalUnitPrice = item.originalUnitPrice || item.product.price;

  // Determinar el modo según el tipo de producto
  const isWeightProduct = item.saleType === 'WEIGHT';
  const isUnitProduct = item.saleType === 'UNIT';
  const isVacuumPacked = item.product.inventoryType === 'VACUUM_PACKED';

  useEffect(() => {
    const priceToShow = isProductWithBatch 
      ? Math.floor(item.unitPrice / item.actualWeight!)
      : item.unitPrice;
    setNewUnitPrice(priceToShow.toFixed(0));
  }, [item.unitPrice, item.actualWeight, isProductWithBatch]);

  const handleApply = () => {
    const newPricePerKg = parseInt(newUnitPrice);

    if (isNaN(newPricePerKg)) {
      setError('Ingrese un precio válido');
      return;
    }

    if (newPricePerKg <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    if (newPricePerKg > originalUnitPrice) {
      setError('El nuevo precio no puede ser mayor al precio original');
      return;
    }

    // Para productos con lote, convertir precio/kg a precio total del paquete
    const finalPrice = isProductWithBatch
      ? Math.round(newPricePerKg * item.actualWeight!)
      : newPricePerKg;

    // Aplicar nuevo precio
    onApplyUnitPrice(finalPrice);
    onClose();
  };

  // Calcular preview
  const previewPricePerKg = parseInt(newUnitPrice) || 0;
  
  // Para productos con lote, calcular total del paquete
  const previewTotal = isProductWithBatch
    ? Math.round(previewPricePerKg * item.actualWeight!)
    : Math.round(item.qty * previewPricePerKg);
    
  const previewExpected = isProductWithBatch
    ? Math.round(item.actualWeight! * originalUnitPrice)
    : Math.round(item.qty * originalUnitPrice);
    
  const previewDiscount = previewExpected - previewTotal;
  const previewPercentage = previewExpected > 0 ? ((previewDiscount / previewExpected) * 100) : 0;

  // Determinar texto según tipo de producto
  let priceLabel = '';
  let unitLabel = '';
  
  if (isWeightProduct || isVacuumPacked) {
    priceLabel = 'Precio por Kg';
    unitLabel = 'kg';
  } else if (isUnitProduct) {
    priceLabel = 'Precio por Unidad';
    unitLabel = 'unidad';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Tag className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Aplicar Descuento</h2>
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
              Cantidad: {isWeightProduct || isVacuumPacked ? item.qty.toFixed(3) : item.qty} {item.unit}
            </span>
          </div>
          {item.scannedBarcode && (
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Escaneado con balanza
            </div>
          )}
        </div>

        {/* Precio original */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">{priceLabel} (Sistema):</span>
            <span className="text-lg font-bold text-blue-900">
              Bs {originalUnitPrice.toFixed(0)}/{unitLabel}
            </span>
          </div>
        </div>

        {/* Input de nuevo precio */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nuevo {priceLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
              Bs
            </span>
            <input
              type="number"
              value={newUnitPrice}
              onChange={(e) => {
                setNewUnitPrice(e.target.value);
                setError('');
              }}
              step="1"
              min="1"
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Solo números enteros (Bs)
          </p>
        </div>

        {/* Preview con detalle */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-200">
          <div className="space-y-2">
            {/* Cantidad */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Cantidad:</span>
              <span className="font-medium text-gray-900">
                {isWeightProduct || isVacuumPacked ? item.qty.toFixed(3) : item.qty} {item.unit}
              </span>
            </div>

            {/* Precio actual */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{priceLabel} actual:</span>
              <span className="font-medium text-gray-900">
                Bs {effectivePricePerKg}/{unitLabel}
              </span>
            </div>

            {/* Nuevo precio */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Nuevo {priceLabel.toLowerCase()}:</span>
              <span className="font-medium text-blue-600">
                Bs {previewPricePerKg}/{unitLabel}
              </span>
            </div>

            <div className="border-t border-green-300 pt-2 mt-2">
              {/* Subtotal esperado */}
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-600">Subtotal esperado:</span>
                <span className="font-medium text-gray-700">
                  Bs {previewExpected}
                </span>
              </div>

              {/* Descuento */}
              {previewDiscount > 0 && (
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600">Descuento ({previewPercentage.toFixed(1)}%):</span>
                  <span className="font-medium text-red-600">
                    -Bs {previewDiscount}
                  </span>
                </div>
              )}

              {/* Nuevo total */}
              <div className="flex justify-between items-center pt-2 border-t border-green-300">
                <span className="text-sm font-semibold text-gray-700">Nuevo Total:</span>
                <span className="text-xl font-bold text-green-700">
                  Bs {previewTotal}
                </span>
              </div>
            </div>
          </div>
        </div>

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
          <Button onClick={handleApply} variant="primary" className="flex-1">
            <DollarSign className="w-4 h-4 mr-1" />
            Aplicar Precio
          </Button>
        </div>
      </div>
    </div>
  );
};
