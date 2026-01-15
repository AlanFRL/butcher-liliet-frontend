import React, { useEffect, useState } from 'react';
import { Plus, Package, DollarSign, Weight, Trash2, CheckCircle, Box } from 'lucide-react';
import { useProductStore } from '../store';

interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  actualWeight: number | string; // Backend returns as string (decimal)
  unitCost: number | string; // Backend returns as string (decimal)
  unitPrice: number | string; // Backend returns as string (decimal)
  isSold: boolean;
  packedAt: string;
  expiryDate: string | null;
  notes?: string;
  isReserved?: boolean;
  reservedInOrder?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

type TabType = 'batches' | 'stock';

interface BatchRow {
  id: string; // Temporary ID for React key
  weight: string;
  price: string;
  packedAt: string;
  expiryDate: string;
}

export const InventoryPage: React.FC = () => {
  const { products, loadProducts } = useProductStore();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductForStock, setSelectedProductForStock] = useState<string>('');
  
  // Multi-batch form state
  const [selectedProductForBatch, setSelectedProductForBatch] = useState('');
  const [batchRows, setBatchRows] = useState<BatchRow[]>([
    { 
      id: '1', 
      weight: '', 
      price: '', 
      packedAt: new Date().toISOString().split('T')[0],
      expiryDate: '' 
    }
  ]);

  // Form state for stock adjustment
  const [stockFormData, setStockFormData] = useState({
    productId: '',
    operation: 'add' as 'add' | 'remove',
    quantity: '',
    reason: ''
  });

  // Load products and batches on mount
  useEffect(() => {
    loadProducts();
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/product-batches?includeReservationStatus=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductForBatch) {
      alert('Selecciona un producto');
      return;
    }

    // Validate all rows
    const validRows = batchRows.filter(row => 
      row.weight && parseFloat(row.weight) > 0 && 
      row.price && parseFloat(row.price) > 0
    );

    if (validRows.length === 0) {
      alert('Agrega al menos un paquete con peso y precio válidos');
      return;
    }

    setIsLoading(true);

    try {
      // Create all batches in sequence
      const product = products.find(p => p.id === selectedProductForBatch);
      // Use local date instead of UTC to avoid timezone issues
      const now = new Date();
      const today = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0');
      
      // Get existing batches for today to calculate next sequence number
      const existingBatchesForToday = batches.filter(b => 
        b.productId === selectedProductForBatch && 
        b.batchNumber.includes(today)
      );
      let nextSequence = existingBatchesForToday.length + 1;
      
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        // Auto-generate batch number: SKU-YYYYMMDD-NNN
        const batchNumber = `${product?.sku || 'VAC'}-${today}-${String(nextSequence).padStart(3, '0')}`;
        nextSequence++;
        
        const response = await fetch('http://localhost:3000/api/product-batches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
          },
          body: JSON.stringify({
            productId: selectedProductForBatch,
            batchNumber,
            actualWeight: parseFloat(row.weight),
            unitCost: 0, // Not used anymore
            unitPrice: parseFloat(row.price),
            packedAt: row.packedAt,
            expiryDate: row.expiryDate || null,
            notes: null
          })
        });

        if (!response.ok) {
          throw new Error(`Error al crear paquete ${i + 1}`);
        }
      }

      await loadBatches();
      await loadProducts();
      setShowBatchModal(false);
      resetBatchForm();
      alert(`${validRows.length} paquete(s) agregado(s) exitosamente`);
    } catch (error) {
      console.error('Error creating batches:', error);
      alert('Error al crear paquetes');
    } finally {
      setIsLoading(false);
    }
  };

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

      const response = await fetch(`http://localhost:3000/api/products/${stockFormData.productId}`, {
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

  const handleMarkAsSold = async (batchId: string) => {
    if (!confirm('¿Marcar este lote como vendido?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/product-batches/${batchId}/mark-sold`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });

      if (response.ok) {
        await loadBatches();
      }
    } catch (error) {
      console.error('Error marking batch as sold:', error);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('¿Eliminar este lote? Solo se pueden eliminar lotes no vendidos.')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/product-batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });

      if (response.ok) {
        await loadBatches();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al eliminar lote');
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const resetBatchForm = () => {
    setSelectedProductForBatch('');
    setBatchRows([
      { 
        id: '1', 
        weight: '', 
        price: '', 
        packedAt: new Date().toISOString().split('T')[0],
        expiryDate: '' 
      }
    ]);
  };

  const addBatchRow = () => {
    const newId = String(Date.now());
    setBatchRows([...batchRows, {
      id: newId,
      weight: '',
      price: '',
      packedAt: new Date().toISOString().split('T')[0],
      expiryDate: ''
    }]);
  };

  const removeBatchRow = (id: string) => {
    if (batchRows.length > 1) {
      setBatchRows(batchRows.filter(row => row.id !== id));
    }
  };

  const updateBatchRow = (id: string, field: keyof BatchRow, value: string) => {
    setBatchRows(batchRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const resetStockForm = () => {
    setStockFormData({
      productId: '',
      operation: 'add',
      quantity: '',
      reason: ''
    });
  };

  // Filter products
  const vacuumPackedProducts = products.filter(p => p.inventoryType === 'VACUUM_PACKED');
  const unitProducts = products.filter(p => 
    p.saleType === 'UNIT' && 
    p.inventoryType !== 'VACUUM_PACKED' && 
    (p.inventoryType === 'UNIT' || p.inventoryType === 'UNIT_STOCK' || !p.inventoryType)
  );

  // Filter batches by selected product
  const filteredBatches = selectedProductId
    ? batches.filter(b => b.productId === selectedProductId)
    : batches;

  // Calculate stats for batches
  const availableBatches = filteredBatches.filter(b => !b.isSold);
  const totalBatchValue = Number(availableBatches.reduce((sum, b) => sum + (Number(b.unitPrice) || 0), 0)) || 0;
  const totalBatchWeight = Number(availableBatches.reduce((sum, b) => sum + (Number(b.actualWeight) || 0), 0)) || 0;

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
          <p className="text-gray-600 mt-1">Gestión de stock y lotes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('stock')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'stock'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Stock por Unidad
              </div>
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'batches'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Lotes (Al Vacío)
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Stock por Unidad Tab */}
      {activeTab === 'stock' && (
        <>
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
        </>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <>
          {/* Header with Add Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowBatchModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar Lote
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Lotes Disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{availableBatches.length}</p>
                </div>
                <Package className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Peso Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBatchWeight.toFixed(2)} kg</p>
                </div>
                <Weight className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Valor Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">Bs {totalBatchValue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">Filtrar por producto:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
              >
                <option value="">Todos los productos</option>
                {vacuumPackedProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio (Bs)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empacado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No hay paquetes registrados
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => (
                    <tr key={batch.id} className={batch.isSold ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {batch.batchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.product?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(batch.actualWeight || 0).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Bs {Number(batch.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(batch.packedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {batch.isSold ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                            Vendido
                          </span>
                        ) : batch.isReserved ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" title={`Reservado en pedido ${batch.reservedInOrder}`}>
                            Reservado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {!batch.isSold && (
                            <>
                              <button
                                onClick={() => handleMarkAsSold(batch.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Marcar como vendido"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBatch(batch.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Batch Modal - Multi-row design */}
          {showBatchModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-5 w-full max-w-4xl max-h-[85vh] flex flex-col">
                <h2 className="text-xl font-bold mb-3">Agregar Paquetes</h2>
                
                <form onSubmit={handleBatchSubmit} className="flex flex-col flex-1">
                  {/* Product Select */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Producto *
                    </label>
                    <select
                      required
                      value={selectedProductForBatch}
                      onChange={(e) => setSelectedProductForBatch(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Seleccionar producto al vacío</option>
                      {vacuumPackedProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                    {vacuumPackedProducts.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        No hay productos al vacío. Créalos primero en Productos.
                      </p>
                    )}
                  </div>

                  {/* Packages Table */}
                  <div className="mb-3 flex-1 overflow-auto">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Paquetes a agregar
                      </label>
                      <button
                        type="button"
                        onClick={addBatchRow}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar fila
                      </button>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">#</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Peso (kg) *</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Precio (Bs) *</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Empacado</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Vence</th>
                            <th className="px-2 py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {batchRows.map((row, index) => (
                            <tr key={row.id} className="bg-white">
                              <td className="px-2 py-1 text-gray-600">{index + 1}</td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0.001"
                                  value={row.weight}
                                  onChange={(e) => updateBatchRow(row.id, 'weight', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  placeholder="0.950"
                                  required
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={row.price}
                                  onChange={(e) => updateBatchRow(row.id, 'price', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  placeholder="45.00"
                                  required
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="date"
                                  value={row.packedAt}
                                  onChange={(e) => updateBatchRow(row.id, 'packedAt', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  required
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="date"
                                  value={row.expiryDate}
                                  onChange={(e) => updateBatchRow(row.id, 'expiryDate', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="px-2 py-1">
                                {batchRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeBatchRow(row.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Los códigos se generan automáticamente (SKU-FECHA-NNN)
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBatchModal(false);
                        resetBatchForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : `Guardar ${batchRows.filter(r => r.weight && r.price).length} paquete(s)`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
