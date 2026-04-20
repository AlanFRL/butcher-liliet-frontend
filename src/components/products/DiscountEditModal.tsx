import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../ui';
import type { Product } from '../../types';
import { productsApi } from '../../services/api';

interface DiscountEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DiscountEditModal: React.FC<DiscountEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [discountActive, setDiscountActive] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form cuando cambia el producto
  useEffect(() => {
    if (product) {
      setDiscountActive(product.discountActive || false);
      setDiscountPrice(product.discountPrice?.toString() || '');
      setError('');
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;

    setError('');

    // Validar que el precio de descuento sea menor que el precio normal
    const discountValue = parseFloat(discountPrice);
    if (discountActive && discountValue >= product.price) {
      setError('El precio de descuento debe ser menor al precio normal');
      return;
    }

    if (discountActive && (isNaN(discountValue) || discountValue < 0)) {
      setError('Ingrese un precio de descuento válido');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🏷️ Actualizando descuento:', {
        productId: product.id,
        discountPrice: discountActive ? discountValue : undefined,
        discountActive
      });

      const result = await productsApi.updateDiscount(product.id, {
        discountPrice: discountActive ? discountValue : undefined,
        discountActive,
      });

      console.log('✅ Descuento actualizado:', result);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Error actualizando descuento:', err);
      setError(err.message || 'Error al actualizar el descuento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Configurar Descuento"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Info del producto */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-600">
              Precio normal: <span className="font-medium">Bs {product.price.toFixed(2)}</span>
            </p>
          </div>

          {/* Toggle para activar descuento */}
          <div className="flex items-center justify-between">
            <label htmlFor="discount-active" className="text-sm font-medium text-gray-700">
              Activar descuento
            </label>
            <button
              type="button"
              id="discount-active"
              onClick={() => setDiscountActive(!discountActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                discountActive ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  discountActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Input de precio de descuento */}
          {discountActive && (
            <div>
              <Input
                label="Precio con descuento"
                type="number"
                step="0.01"
                min="0"
                max={product.price}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="0.00"
                required={discountActive}
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe ser menor a Bs {product.price.toFixed(2)}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
