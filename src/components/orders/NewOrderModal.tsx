import React, { useState } from 'react';
import { Search, Package, XCircle, Tag } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useOrderStore, useProductStore } from '../../store';
import type { Product, ProductBatch } from '../../types';
import { ItemDiscountModal } from '../ItemDiscountModal';
import type { CartItem } from '../../types';

interface NewOrderModalProps {
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ onClose, showToast }) => {
  const [step, setStep] = useState<'customer' | 'products' | 'details'>('customer');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    product: Product;
    qty: number;
    notes: string;
    discount?: number; // Nuevo: descuento por item
    batchId?: string;
    batchNumber?: string;
    actualWeight?: number;
    batchPrice?: number;
    needsBatchCreation?: boolean;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0); // Nuevo: descuento global
  // Estado local para los inputs de cantidad (permite edición libre)
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  // Estados para modal de lotes
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [availableBatches, setAvailableBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showManualBatchForm, setShowManualBatchForm] = useState(false);
  const [manualBatchData, setManualBatchData] = useState({ weight: '', price: '' });
  // Estados para modal de descuento
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<{
    index: number;
    product: Product;
    qty: number;
    unitPrice: number;
    discount: number;
  } | null>(null);

  const { products } = useProductStore();
  const { createOrder } = useOrderStore();

  const activeProducts = products.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async (product: Product) => {
    // Si es producto al vacío, mostrar modal de selección de lotes
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

    // Para productos normales, agregar directamente
    const existing = selectedItems.find((item) => item.product.id === product.id && !item.batchId);
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
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
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });
      
      if (response.ok) {
        const allBatches: ProductBatch[] = await response.json();
        // Obtener IDs de lotes ya seleccionados (sin depender del estado del componente)
        const batchIdsInOrder = selectedItems
          .filter(item => item.batchId)
          .map(item => item.batchId);
        
        console.log('📦 Lotes ya en pedido:', batchIdsInOrder);
        
        // Filtrar solo lotes del producto seleccionado, no vendidos, no reservados y no ya en el pedido
        const filtered = allBatches.filter(
          b => b.productId === productId && 
               !b.isSold && 
               !(b as any).isReserved &&
               !batchIdsInOrder.includes(b.id)
        );
        setAvailableBatches(filtered);
      } else {
        console.error('Error loading batches');
        setAvailableBatches([]);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      setAvailableBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSelectBatch = (batch: ProductBatch) => {
    if (!selectedProductForBatch) return;
    
    // Agregar el lote como un item nuevo
    setSelectedItems([
      ...selectedItems,
      {
        product: selectedProductForBatch,
        qty: 1, // Los lotes siempre son 1 unidad
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
    setShowManualBatchForm(false);
    setManualBatchData({ weight: '', price: '' });
  };
  
  const handleAddManualBatch = () => {
    if (!selectedProductForBatch) return;
    
    const weight = parseFloat(manualBatchData.weight);
    const price = parseFloat(manualBatchData.price);
    
    if (isNaN(weight) || weight <= 0 || isNaN(price) || price <= 0) {
      showToast('warning', 'Por favor ingrese peso y precio válidos');
      return;
    }
    
    // Agregar como lote fantasma
    setSelectedItems([
      ...selectedItems,
      {
        product: selectedProductForBatch,
        qty: 1,
        notes: '',
        actualWeight: weight,
        batchPrice: price,
        batchNumber: '⚠️ Por registrar',
        needsBatchCreation: true,
      },
    ]);
    
    setShowBatchModal(false);
    setSelectedProductForBatch(null);
    setAvailableBatches([]);
    setShowManualBatchForm(false);
    setManualBatchData({ weight: '', price: '' });
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    // Permitir 0 temporalmente mientras escribe, pero no negativos
    if (qty < 0) {
      return;
    }
    
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.product.id !== productId) return item;
        
        // Si hay descuento aplicado, recalcularlo proporcionalmente
        if (item.discount && item.discount > 0) {
          const price = item.batchPrice || item.product.price;
          const oldQty = item.qty;
          
          // Calcular el precio efectivo por unidad (precio con descuento)
          const oldTotal = Math.round(oldQty * price);
          const effectiveUnitPrice = (oldTotal - item.discount) / oldQty;
          
          // Aplicar el mismo precio efectivo a la nueva cantidad
          const newSubtotal = Math.round(qty * price);
          const newTotal = Math.round(qty * effectiveUnitPrice);
          const newDiscount = Math.round(newSubtotal - newTotal);
          
          return { ...item, qty, discount: newDiscount > 0 ? newDiscount : 0 };
        }
        
        return { ...item, qty };
      })
    );
  };
  
  // Obtener valor del input (local o del item)
  const getInputValue = (productId: string, qty: number, saleType: 'UNIT' | 'WEIGHT') => {
    if (qtyInputs[productId] !== undefined) {
      return qtyInputs[productId];
    }
    return saleType === 'WEIGHT' ? qty.toFixed(3) : qty.toString();
  };
  
  // Manejar cambio en input
  const handleQtyInputChange = (productId: string, value: string) => {
    // Guardar en estado local
    setQtyInputs(prev => ({ ...prev, [productId]: value }));
  };
  
  // Manejar blur (cuando pierde foco)
  const handleQtyInputBlur = (productId: string, saleType: 'UNIT' | 'WEIGHT') => {
    const inputValue = qtyInputs[productId] || '';
    const normalizedValue = inputValue.replace(',', '.');
    
    let finalQty: number;
    
    if (saleType === 'UNIT') {
      // Unidades: debe ser entero >= 1
      const parsed = parseInt(normalizedValue, 10);
      finalQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    } else {
      // Peso: debe ser >= 0.01 con máx 2 decimales
      const parsed = parseFloat(normalizedValue);
      if (isNaN(parsed) || parsed < 0.01) {
        finalQty = 0.01;
      } else {
        // Limitar a 2 decimales
        finalQty = Math.round(parsed * 100) / 100;
      }
    }
    
    // Actualizar item y limpiar estado local
    handleUpdateQty(productId, finalQty);
    setQtyInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[productId];
      return newInputs;
    });
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !deliveryDate || !deliveryTime || selectedItems.length === 0) {
      showToast('warning', 'Por favor completa todos los campos requeridos');
      return;
    }
    
    // Validar que no haya items con cantidad 0
    const hasInvalidItems = selectedItems.some(item => item.qty <= 0);
    if (hasInvalidItems) {
      showToast('warning', 'Por favor, ingrese cantidades válidas para todos los productos');
      return;
    }

    try {
      // PASO 1: Crear lotes fantasma ANTES de crear el pedido
      const itemsWithBatches = [...selectedItems];
      
      for (let i = 0; i < itemsWithBatches.length; i++) {
        const item = itemsWithBatches[i];
        
        if (item.needsBatchCreation && item.actualWeight && item.batchPrice) {
          console.log(`📦 Creando lote fantasma para pedido: ${item.product.name}`);
          
          // Generar batchNumber automático
          const now = new Date();
          const today = now.getFullYear() + 
            String(now.getMonth() + 1).padStart(2, '0') + 
            String(now.getDate()).padStart(2, '0');
          
          const batchNumber = `${item.product.sku}-${today}-AUTO-${Date.now().toString().slice(-4)}`;
          
          // Crear lote en backend
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
          const response = await fetch(`${API_BASE_URL}/product-batches`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
            },
            body: JSON.stringify({
              productId: item.product.id,
              batchNumber,
              actualWeight: item.actualWeight,
              unitCost: 0,
              unitPrice: item.batchPrice,
              packedAt: new Date().toISOString(),
              expiryDate: null,
              notes: 'Creado automáticamente desde pedido'
            })
          });
          
          if (response.ok) {
            const createdBatch = await response.json();
            // Actualizar item con el batchId real
            itemsWithBatches[i] = {
              ...item,
              batchId: createdBatch.id,
              batchNumber: createdBatch.batchNumber,
              needsBatchCreation: false
            };
            console.log(`✅ Lote creado: ${createdBatch.batchNumber}`);
          } else {
            console.error('❌ Error creando lote fantasma:', await response.text());
            throw new Error('Error al crear lote necesario');
          }
        }
      }

      // PASO 2: Crear el pedido con los lotes ya creados
      const orderItems = itemsWithBatches.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
        discount: item.discount || 0, // Incluir descuento por item
        notes: item.notes || undefined,
        batchId: item.batchId, // Incluir batchId si existe
      }));

      const result = await createOrder({
        customerName,
        customerPhone,
        items: orderItems,
        discount: globalDiscount, // Incluir descuento global
        deliveryDate,
        deliveryTime,
        notes: notes || undefined,
      });

      if (result) {
        showToast('success', 'Pedido creado exitosamente');
        onClose();
      } else {
        showToast('error', 'Error al crear el pedido. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      showToast('error', 'Error al crear el pedido. Por favor intenta nuevamente.');
    }
  };
  
  // Funciones para manejar descuentos
  const handleOpenDiscountModal = (index: number) => {
    const item = selectedItems[index];
    const unitPrice = item.batchPrice || item.product.price;
    setSelectedItemForDiscount({
      index,
      product: item.product,
      qty: item.qty,
      unitPrice,
      discount: item.discount || 0,
    });
    setShowDiscountModal(true);
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => {
      const price = item.batchPrice || item.product.price;
      const itemTotal = Math.round(item.qty * price);
      const itemDiscount = Math.round(item.discount || 0);
      return sum + Math.round(itemTotal - itemDiscount);
    },
    0
  );
  
  const finalTotal = Math.max(0, totalAmount - globalDiscount);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Nuevo Pedido"
      size="xl"
    >
      <div className="space-y-6">
        {/* Steps */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex-1 text-center ${step === 'customer' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step === 'customer' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            Cliente
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
          <div className={`flex-1 text-center ${step === 'products' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step === 'products' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            Productos
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
          <div className={`flex-1 text-center ${step === 'details' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step === 'details' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            Detalles
          </div>
        </div>

        {/* Paso 1: Cliente */}
        {step === 'customer' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Juan Pérez"
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
                placeholder="Ej: 70123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <Button
              onClick={() => setStep('products')}
              disabled={!customerName || !customerPhone}
              variant="primary"
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Paso 2: Productos */}
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
                              Bs {Math.round(product.price)}
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
                    selectedItems.map((item, index) => {
                      const currentInOrder = selectedItems
                        .filter(i => i.product.id === item.product.id && !i.batchId)
                        .reduce((sum, i) => sum + i.qty, 0);
                      const availableStock = (item.product.stockUnits || 0) - currentInOrder + item.qty;
                      
                      return (
                      <div key={`${item.product.id}-${item.batchId || index}`} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                              {item.needsBatchCreation && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                                  ⚠️ Por registrar
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                            {item.batchId && !item.needsBatchCreation && (
                              <p className="text-xs text-blue-600 mt-1">
                                📦 {item.batchNumber} ({item.actualWeight} kg)
                              </p>
                            )}
                            {item.needsBatchCreation && (
                              <p className="text-xs text-yellow-600 mt-1">
                                📦 Lote: {item.actualWeight} kg - Se creará al guardar
                              </p>
                            )}
                            {/* Mostrar stock para productos UNIT */}
                            {item.product.saleType === 'UNIT' && item.product.inventoryType === 'UNIT' && !item.batchId && (
                              <p className="text-xs text-gray-500 mt-1">
                                Stock: {availableStock} disponibles
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
                        {/* Si es lote o tiene needsBatchCreation, mostrar solo info (no editable) */}
                        {(item.batchId || item.needsBatchCreation) ? (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">{item.actualWeight?.toFixed(3)} kg × Bs {Math.round((item.batchPrice || 0) / (item.actualWeight || 1))}/kg</span>
                                <span className="text-xs text-gray-500">1 paquete</span>
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">
                                Bs {Math.round(item.batchPrice || 0)}
                              </span>
                            </div>
                            {item.discount && item.discount > 0 && (
                              <>
                                <div className="flex items-center justify-between text-xs text-green-600">
                                  <span>Descuento:</span>
                                  <span>-Bs {Math.round(item.discount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                                  <span>Total:</span>
                                  <span>Bs {Math.round((item.batchPrice || 0) - item.discount)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <button
                                onClick={() => handleOpenDiscountModal(index)}
                                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {item.discount ? 'Editar' : 'Aplicar'} descuento
                              </button>
                            </div>
                          </div>
                        ) : item.product.saleType === 'UNIT' ? (
                          /* Productos UNIT: Botones +/- */
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newQty = item.qty - 1;
                                    if (newQty > 0) handleUpdateQty(item.product.id, newQty);
                                  }}
                                  className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                                >
                                  <span className="text-gray-600">−</span>
                                </button>
                                <span className="w-12 text-center font-medium text-sm">{item.qty}</span>
                                <button
                                  onClick={() => {
                                    const newQty = item.qty + 1;
                                    if (newQty <= (item.product.stockUnits || 0)) {
                                      handleUpdateQty(item.product.id, newQty);
                                    } else {
                                      showToast('warning', `Stock insuficiente. Solo hay ${item.product.stockUnits} unidades`);
                                    }
                                  }}
                                  className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                                >
                                  <span className="text-gray-600">+</span>
                                </button>
                                <span className="text-xs text-gray-500">{item.product.unit}</span>
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">
                                Bs {Math.round(item.qty * item.product.price)}
                              </span>
                            </div>
                            {item.discount && item.discount > 0 && (
                              <>
                                <div className="flex items-center justify-between text-xs text-green-600">
                                  <span>Descuento:</span>
                                  <span>-Bs {Math.round(item.discount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                                  <span>Total:</span>
                                  <span>Bs {Math.round(item.qty * item.product.price - item.discount)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <button
                                onClick={() => handleOpenDiscountModal(index)}
                                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {item.discount ? 'Editar' : 'Aplicar'} descuento
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Productos WEIGHT: Input manual */
                          <div>
                            <div className="flex items-center gap-2 mb-1">
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
                            {item.discount && item.discount > 0 && (
                              <>
                                <div className="flex items-center justify-between text-xs text-green-600">
                                  <span>Descuento:</span>
                                  <span>-Bs {Math.round(item.discount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                                  <span>Total:</span>
                                  <span>Bs {Math.round(item.qty * item.product.price - item.discount)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <button
                                onClick={() => handleOpenDiscountModal(index)}
                                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {item.discount ? 'Editar' : 'Aplicar'} descuento
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })
                  )}
                </div>
                <div className="p-3 bg-white border-t-2 border-primary-600 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      Bs {Math.round(selectedItems.reduce((sum, item) => {
                        const price = item.batchPrice || item.product.price;
                        return sum + Math.round(item.qty * price);
                      }, 0))}
                    </span>
                  </div>
                  {selectedItems.some(item => item.discount && item.discount > 0) && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Descuentos en items:</span>
                      <span>
                        -Bs {Math.round(selectedItems.reduce((sum, item) => sum + (item.discount || 0), 0))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <label className="text-gray-600">Descuento global:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={globalDiscount}
                        onChange={(e) => setGlobalDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-gray-600">Bs</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-bold">Total Final:</span>
                      <span className="text-xl font-bold text-primary-700">Bs {Math.round(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones siempre visibles */}
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep('customer')} variant="outline" className="flex-1">
                Atrás
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={selectedItems.length === 0}
                variant="primary"
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Detalles */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={(() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })()}
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
                  min={(() => {
                    // Si es hoy, solo permitir desde la hora actual
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const todayStr = `${year}-${month}-${day}`;
                    
                    if (deliveryDate === todayStr) {
                      const hours = String(today.getHours()).padStart(2, '0');
                      const minutes = String(today.getMinutes()).padStart(2, '0');
                      return `${hours}:${minutes}`;
                    }
                    return undefined;
                  })()}
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
                Crear Pedido
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Selección de Lotes */}
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando lotes disponibles...</p>
              </div>
            ) : availableBatches.length === 0 ? (
              <div className="space-y-4">
                {!showManualBatchForm ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No hay lotes disponibles</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Todos los lotes de este producto están vendidos o ya están en el pedido.
                    </p>
                    <Button
                      onClick={() => setShowManualBatchForm(true)}
                      variant="primary"
                      className="mt-4"
                    >
                      ⚠️ Agregar lote no registrado
                    </Button>
                    <Button
                      onClick={() => {
                        setShowBatchModal(false);
                        setSelectedProductForBatch(null);
                        setAvailableBatches([]);
                      }}
                      variant="outline"
                      className="mt-2"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-3">Datos del Lote No Registrado</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Peso (kg) *
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={manualBatchData.weight}
                          onChange={(e) => setManualBatchData(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="0.950"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio (Bs) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualBatchData.price}
                          onChange={(e) => setManualBatchData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="45.00"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mb-3">
                      ⚠️ Este lote se registrará en el inventario al crear el pedido y quedará reservado
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={handleAddManualBatch} variant="primary" size="sm" className="flex-1">
                        Agregar al Pedido
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowManualBatchForm(false);
                          setManualBatchData({ weight: '', price: '' });
                        }}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Selecciona el paquete específico que deseas agregar al pedido
                </p>
                
                {/* Botón para añadir lote no registrado */}
                <button
                  onClick={() => setShowManualBatchForm(true)}
                  className="w-full p-3 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-700 font-semibold">⚠️ Agregar lote no registrado</span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Si tienes un producto empacado que no está en el inventario
                  </p>
                </button>
                
                {/* Formulario manual de lote fantasma */}
                {showManualBatchForm && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-3">Datos del Lote No Registrado</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Peso (kg) *
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={manualBatchData.weight}
                          onChange={(e) => setManualBatchData(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="0.950"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio (Bs) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualBatchData.price}
                          onChange={(e) => setManualBatchData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="45.00"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mb-3">
                      ⚠️ Este lote se registrará en el inventario al crear el pedido y quedará reservado
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={handleAddManualBatch} variant="primary" size="sm" className="flex-1">
                        Agregar al Pedido
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowManualBatchForm(false);
                          setManualBatchData({ weight: '', price: '' });
                        }}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {availableBatches.map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => handleSelectBatch(batch)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-gray-900">{batch.batchNumber}</span>
                        <span className="text-2xl font-bold text-primary-700">
                          Bs {Math.round(Number(batch.unitPrice))}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Peso:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {Number(batch.actualWeight).toFixed(3)} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Empacado:</span>
                          <span className="ml-2 font-medium text-gray-700">
                            {new Date(batch.packedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
      
      {/* Modal de descuento */}
      {showDiscountModal && selectedItemForDiscount && (() => {
        const item = selectedItems[selectedItemForDiscount.index];
        return (
          <ItemDiscountModal
            item={{
              id: selectedItemForDiscount.index.toString(),
              productId: selectedItemForDiscount.product.id,
              productName: selectedItemForDiscount.product.name,
              saleType: selectedItemForDiscount.product.saleType,
              qty: selectedItemForDiscount.qty,
              unit: selectedItemForDiscount.product.unit,
              unitPrice: selectedItemForDiscount.unitPrice,
              discount: selectedItemForDiscount.discount,
              total: selectedItemForDiscount.qty * selectedItemForDiscount.unitPrice - selectedItemForDiscount.discount,
              product: selectedItemForDiscount.product,
              actualWeight: item?.actualWeight, // Incluir actualWeight si existe
              batchId: item?.batchId,
              batchNumber: item?.batchNumber,
            } as CartItem}
            onClose={() => {
              setShowDiscountModal(false);
              setSelectedItemForDiscount(null);
            }}
            onApplyUnitPrice={(newUnitPrice) => {
              // Aplicar nuevo precio unitario
              const item = selectedItems[selectedItemForDiscount.index];
              if (item) {
                const originalPrice = item.batchPrice || item.product.price;
                const newTotal = Math.round(item.qty * newUnitPrice);
                const expectedTotal = Math.round(item.qty * originalPrice);
                const newDiscount = Math.round(expectedTotal - newTotal);
                
                setSelectedItems(selectedItems.map((i, idx) => 
                  idx === selectedItemForDiscount.index
                    ? { ...i, discount: newDiscount }
                    : i
                ));
              }
              setShowDiscountModal(false);
              setSelectedItemForDiscount(null);
            }}
          />
        );
      })()}
    </Modal>
  );
};
