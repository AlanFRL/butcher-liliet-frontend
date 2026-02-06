import React, { useState } from 'react';
import { Search, Package, XCircle } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useOrderStore, useProductStore } from '../../store';
import type { Order, Product, ProductBatch } from '../../types';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, showToast }) => {
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate);
  // PostgreSQL returns time as HH:mm:ss, but input[type="time"] and backend expect HH:mm
  const [deliveryTime, setDeliveryTime] = useState(
    order.deliveryTime?.substring(0, 5) || '' // Extract HH:mm from HH:mm:ss
  );
  const [notes, setNotes] = useState(order.notes || '');
  const [selectedItems, setSelectedItems] = useState<Array<{
    product: Product;
    qty: number;
    notes: string;
    batchId?: string;
    batchNumber?: string;
    actualWeight?: number;
    batchPrice?: number;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [availableBatches, setAvailableBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [step, setStep] = useState<'products' | 'details'>('products');

  const { products } = useProductStore();
  const { updateOrder } = useOrderStore();

  // Cargar productos del pedido al iniciar
  React.useEffect(() => {
    const items = order.items.map(item => {
      // Buscar el producto actual en el sistema
      const product = products.find(p => p.id === item.productId);
      
      // Si no existe, crear temporal con datos del pedido
      const productData: Product = product || {
        id: item.productId,
        categoryId: null,
        name: item.productName,
        sku: item.productSku,
        barcode: undefined, // No disponible en datos históricos
        barcodeType: 'NONE',
        saleType: item.unit === 'kg' ? 'WEIGHT' as const : 'UNIT' as const,
        unit: item.unit,
        price: item.unitPrice,
        taxRate: 0,
        isActive: false,
        inventoryType: item.batchId ? 'BATCH' as const : undefined,
      };

      const selectedItem: {
        product: Product;
        qty: number;
        notes: string;
        batchId?: string;
        batchNumber?: string;
        actualWeight?: number;
        batchPrice?: number;
      } = {
        product: productData,
        qty: item.qty,
        notes: item.notes || '',
      };

      // Si tiene batch, agregar info del batch
      if (item.batchId && item.batch) {
        selectedItem.batchId = item.batchId;
        selectedItem.batchNumber = item.batch.batchNumber;
        selectedItem.actualWeight = typeof item.batch.actualWeight === 'string' 
          ? parseFloat(item.batch.actualWeight)
          : item.batch.actualWeight;
        selectedItem.batchPrice = typeof item.batch.unitPrice === 'string'
          ? parseFloat(item.batch.unitPrice)
          : item.batch.unitPrice;
      }

      return selectedItem;
    });

    setSelectedItems(items);

    // Inicializar inputs de cantidad
    const inputs: { [key: string]: string } = {};
    items.forEach(item => {
      inputs[item.product.id] = item.qty.toString();
    });
    setQtyInputs(inputs);
  }, [order, products]);

  const activeProducts = products.filter(p => p.isActive);
  const filteredProducts = activeProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async (product: Product) => {
    // Si es producto al vacío, mostrar modal de lotes
    if (product.inventoryType === 'VACUUM_PACKED') {
      setSelectedProductForBatch(product);
      setShowBatchModal(true);
      await loadBatches(product.id);
      return;
    }

    // Validar stock disponible para productos por unidad
    if (product.saleType === 'UNIT' && product.inventoryType === 'UNIT') {
      const currentInOrder = selectedItems
        .filter(item => item.product.id === product.id && !item.batchId)
        .reduce((sum, item) => sum + item.qty, 0);
      const availableStock = (product.stockUnits || 0) - currentInOrder;
      
      if (availableStock <= 0) {
        showToast('warning', `Stock insuficiente. Solo hay ${product.stockUnits || 0} unidades disponibles`);
        return;
      }
    }

    // Producto normal
    const existing = selectedItems.find(item => item.product.id === product.id && !item.batchId);
    if (existing) {
      setSelectedItems(
        selectedItems.map(item =>
          item.product.id === product.id && !item.batchId
            ? { ...item, qty: item.qty + (product.saleType === 'WEIGHT' ? 1 : 1) }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product,
          qty: product.saleType === 'WEIGHT' ? 1 : 1,
          notes: '',
        },
      ]);
    }
  };

  const loadBatches = async (productId: string) => {
    setLoadingBatches(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/product-batches?includeReservationStatus=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Error al cargar lotes');
      
      const allBatches: ProductBatch[] = await response.json();
      
      // Filtrar lotes del producto, no vendidos, no reservados, y no ya seleccionados en este pedido
      const batchIdsInOrder = selectedItems
        .filter(item => item.batchId)
        .map(item => item.batchId);
      
      console.log('📦 Lotes ya en pedido (edición):', batchIdsInOrder);
      
      const filtered = allBatches.filter(
        b => b.productId === productId && !b.isSold && !(b as any).isReserved && !batchIdsInOrder.includes(b.id)
      );
      
      setAvailableBatches(filtered);
    } catch (error) {
      console.error('Error loading batches:', error);
      showToast('error', 'Error al cargar lotes disponibles');
      setAvailableBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSelectBatch = (batch: ProductBatch) => {
    if (!selectedProductForBatch) return;

    setSelectedItems([
      ...selectedItems,
      {
        product: selectedProductForBatch,
        qty: 1,
        notes: '',
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        actualWeight: Number(batch.actualWeight),
        batchPrice: Number(batch.unitPrice),
      },
    ]);

    setShowBatchModal(false);
    setSelectedProductForBatch(null);
    setAvailableBatches([]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty < 0) return;
    
    setSelectedItems(
      selectedItems.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      )
    );
  };
  
  const getInputValue = (productId: string, qty: number, saleType: 'UNIT' | 'WEIGHT') => {
    if (qtyInputs[productId] !== undefined) {
      return qtyInputs[productId];
    }
    return saleType === 'WEIGHT' ? qty.toFixed(3) : qty.toString();
  };
  
  const handleQtyInputChange = (productId: string, value: string) => {
    setQtyInputs(prev => ({ ...prev, [productId]: value }));
  };
  
  const handleQtyInputBlur = (productId: string, saleType: 'UNIT' | 'WEIGHT') => {
    const inputValue = qtyInputs[productId] || '';
    const normalizedValue = inputValue.replace(',', '.');
    
    let finalQty: number;
    
    if (saleType === 'UNIT') {
      const parsed = parseInt(normalizedValue, 10);
      finalQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    } else {
      const parsed = parseFloat(normalizedValue);
      if (isNaN(parsed) || parsed < 0.01) {
        finalQty = 0.01;
      } else {
        finalQty = Math.round(parsed * 100) / 100;
      }
    }
    
    handleUpdateQty(productId, finalQty);
    setQtyInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[productId];
      return newInputs;
    });
  };

  const totalAmount = selectedItems.reduce((sum, item) => {
    const price = item.batchPrice || item.product.price;
    return sum + item.qty * price;
  }, 0);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      showToast('warning', 'Ingresa el nombre del cliente');
      return;
    }

    if (!customerPhone.trim()) {
      showToast('warning', 'Ingresa el teléfono del cliente');
      return;
    }

    if (!deliveryDate) {
      showToast('warning', 'Selecciona una fecha de entrega');
      return;
    }

    if (!deliveryTime) {
      showToast('warning', 'Selecciona una hora de entrega');
      return;
    }

    if (selectedItems.length === 0) {
      showToast('warning', 'Agrega al menos un producto');
      return;
    }

    // Actualizar pedido con nueva firma (async)
    const orderItems = selectedItems.map((item) => ({
      productId: item.product.id,
      qty: item.qty,
      notes: item.notes || undefined,
      batchId: item.batchId,
    }));

    const result = await updateOrder(order.id, {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryDate,
      deliveryTime,
      notes: notes.trim() || undefined,
      items: orderItems as any,
    });

    if (result) {
      showToast('success', 'Pedido actualizado correctamente');
      onClose();
    } else {
      showToast('error', 'Error al actualizar el pedido. Por favor intenta nuevamente.');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Pedido" size="xl">
      <div className="space-y-6">
        {/* Steps */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex-1 text-center ${step === 'products' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step === 'products' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            Productos
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
          <div className={`flex-1 text-center ${step === 'details' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step === 'details' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            Detalles
          </div>
        </div>

        {/* Paso: Productos */}
        {step === 'products' && (
          <div className="flex flex-col" style={{ height: '480px' }}>
            {/* Vista de dos columnas similar al POS */}
            <div className="grid grid-cols-2 gap-4 overflow-hidden" style={{ height: '410px' }}>
              {/* Columna izquierda: Productos disponibles */}
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar productos..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="w-full p-3 hover:bg-primary-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-0 text-left"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-right ml-2">
                        {product.inventoryType === 'VACUUM_PACKED' ? (
                          <>
                            <p className="text-blue-600 font-semibold text-sm">📦 Ver lotes</p>
                            <p className="text-xs text-gray-500">Paquetes</p>
                          </>
                        ) : (
                          <>
                            <p className="text-primary-700 font-semibold text-sm">
                              Bs {product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">/{product.unit}</p>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Columna derecha: Productos seleccionados */}
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-3 bg-primary-600 text-white border-b border-primary-700">
                  <h4 className="font-semibold text-sm">
                    Pedido ({selectedItems.length} {selectedItems.length === 1 ? 'producto' : 'productos'})
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {selectedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p className="text-sm">No hay productos seleccionados</p>
                      <p className="text-xs">Selecciona productos de la lista</p>
                    </div>
                  ) : (
                    selectedItems.map((item, index) => (
                      <div key={`${item.product.id}-${item.batchId || index}`} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                            {item.batchId && (
                              <p className="text-xs text-blue-600 mt-1">
                                📦 {item.batchNumber} ({item.actualWeight?.toFixed(3)} kg)
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Si es producto al vacío (BATCH) o tiene lote, mostrar solo info (no editable) */}
                        {item.product.inventoryType === 'BATCH' || item.batchId ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">1 paquete</span>
                            <span className="font-semibold text-gray-900 text-sm">
                              Bs {Math.round(item.batchPrice || item.product.price)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={getInputValue(item.product.id, item.qty, item.product.saleType)}
                              onChange={(e) => handleQtyInputChange(item.product.id, e.target.value)}
                              onBlur={() => handleQtyInputBlur(item.product.id, item.product.saleType)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-xs text-gray-500">{item.product.unit}</span>
                            <span className="ml-auto font-semibold text-gray-900 text-sm">
                              Bs {Math.round(item.qty * item.product.price)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-white border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-primary-700">
                      Bs {Math.round(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => setStep('details')}
                variant="primary"
                className="flex-1"
                disabled={selectedItems.length === 0}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Paso: Detalles */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Pedido
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ej: Cortes finos, sin grasa, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Resumen del Pedido</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="font-medium">{customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-primary-700">Bs {Math.round(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep('products')} variant="outline" className="flex-1">
                Atrás
              </Button>
              <Button onClick={handleSubmit} variant="primary" className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de selección de lotes */}
      {showBatchModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedProductForBatch(null);
            setAvailableBatches([]);
          }}
          title={`Seleccionar Lote - ${selectedProductForBatch?.name || ''}`}
          size="lg"
        >
          <div className="space-y-4">
            {loadingBatches ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mb-3"></div>
                <p>Cargando lotes disponibles...</p>
              </div>
            ) : availableBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Package className="w-16 h-16 mb-3" />
                <p className="text-lg font-medium">No hay lotes disponibles</p>
                <p className="text-sm">Este producto no tiene lotes disponibles para venta</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableBatches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => handleSelectBatch(batch)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 group-hover:text-primary-700">
                        {batch.batchNumber}
                      </span>
                      <span className="text-lg font-bold text-primary-700">
                        Bs {Number(batch.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Peso:</span> {Number(batch.actualWeight).toFixed(3)} kg
                      </div>
                      <div>
                        <span className="font-medium">Empacado:</span> {new Date(batch.packedAt).toLocaleDateString('es-BO')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button onClick={() => {
              setShowBatchModal(false);
              setSelectedProductForBatch(null);
              setAvailableBatches([]);
            }} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
