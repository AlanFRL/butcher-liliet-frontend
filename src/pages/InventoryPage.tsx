import React, { useEffect, useState } from 'react';
import { Package, DollarSign, Box } from 'lucide-react';
import { useProductStore } from '../store';

export const InventoryPage: React.FC = () => {
  const { products, loadProducts } = useProductStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<string>('');

  // Form state for stock adjustment
  const [stockFormData, setStockFormData] = useState({
    productId: '',
    operation: 'add' as 'add' | 'remove',
    quantity: '',
    reason: ''
  });

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const quantity = parseFloat(stockFormData.quantity);
      const adjustment = stockFormData.operation === 'add' ? quantity : -quantity;
      const product = products.find(p => p.id === stockFormData.productId);
      
      if (!product) return;

      const newStock = (product.stockUnits || 0) + adjustment;
      if (newStock < 0) {
        alert('El stock no puede ser negativo');
        setIsLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/products/${stockFormData.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        },
        body: JSON.stringify({
          stockQuantity: newStock
        })
      });

      if (response.ok) {
        await loadProducts();
        setShowStockModal(false);
        resetStockForm();
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error al ajustar stock');
    } finally {
      setIsLoading(false);
    }
  };

  const resetStockForm = () => {
    setStockFormData({
      productId: '',
      operation: 'add',
      quantity: '',
      reason: ''
    });
  };

  // Filter products - solo productos UNIT tienen inventario
  const unitProducts = products.filter(p => p.saleType === 'UNIT');

  // Calculate stats for unit products
  const totalUnitProducts = unitProducts.length;
  const totalStockValue = unitProducts.reduce((sum, p) => sum + ((p.stockUnits || 0) * p.price), 0);
  const lowStockProducts = unitProducts.filter(p => 
    p.minStockAlert && p.stockUnits !== undefined && p.stockUnits < p.minStockAlert
  ).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestión de stock de productos</p>
        </div>
      </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUnitProducts}</p>
                </div>
                <Box className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">Bs {totalStockValue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Stock Bajo</p>
                  <p className="text-2xl font-bold text-gray-900">{lowStockProducts}</p>
                </div>
                <Package className="w-10 h-10 text-red-600" />
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Productos por Unidad</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unitProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No hay productos por unidad
                    </td>
                  </tr>
                ) : (
                  unitProducts.map(product => {
                    const isLowStock = product.minStockAlert && product.stockUnits !== undefined && product.stockUnits < product.minStockAlert;
                    return (
                      <tr key={product.id} className={isLowStock ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">{product.stockUnits || 0}</span> {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.minStockAlert || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Bs {product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLowStock ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setSelectedProductForStock(product.id);
                              setStockFormData({ ...stockFormData, productId: product.id });
                              setShowStockModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-900 font-medium"
                          >
                            Ajustar Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Stock Adjustment Modal */}
          {showStockModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Ajustar Stock</h2>
                
                <form onSubmit={handleStockAdjustment}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto
                      </label>
                      <p className="font-semibold">
                        {products.find(p => p.id === selectedProductForStock)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock actual: {products.find(p => p.id === selectedProductForStock)?.stockUnits || 0}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Operación *
                      </label>
                      <div className="flex gap-3 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="operation"
                            value="add"
                            checked={stockFormData.operation === 'add'}
                            onChange={() => setStockFormData({ ...stockFormData, operation: 'add' })}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm">Agregar stock</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="operation"
                            value="remove"
                            checked={stockFormData.operation === 'remove'}
                            onChange={() => setStockFormData({ ...stockFormData, operation: 'remove' })}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm">Quitar stock</span>
                        </label>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={stockFormData.quantity}
                        onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo
                      </label>
                      <textarea
                        value={stockFormData.reason}
                        onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={3}
                        placeholder="Compra, vencimiento, pérdida, ajuste, etc."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStockModal(false);
                        resetStockForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </div>
  );
};
