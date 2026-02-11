import React, { useState } from 'react';
import { Search, Package, XCircle, Tag } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useOrderStore, useProductStore } from '../../store';
import type { Product } from '../../types';
import { ItemDiscountModal } from '../ItemDiscountModal';
import type { CartItem } from '../../types';
import CustomerSelector from '../CustomerSelector';
import { type CustomerResponse } from '../../services/api';
import { useScanner } from '../../hooks/useScanner';

interface NewOrderModalProps {
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ onClose, showToast }) => {
  const [step, setStep] = useState<'customer' | 'products' | 'details'>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [customerName, setCustomerName] = useState(''); // Snapshot
  const [customerPhone, setCustomerPhone] = useState(''); // Snapshot
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    product: Product;
    qty: number;
    notes: string;
    discount?: number; // descuento por item
    barcode?: string; // código de barras (para productos escaneados)
    customUnitPrice?: number; // precio unitario real (si difiere del sistema)
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0); // descuento global
  // Estado local para los inputs de cantidad (permite edición libre)
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
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
  
  // Scanner hook para Paso 2 (productos)
  const { scannerFeedback } = useScanner({
    isActive: step === 'products' && !showDiscountModal,
    onProductScanned: (product, qty, metadata) => {
      // Validar stock disponible para productos por unidad
      if (product.saleType === 'UNIT') {
        const currentInOrder = selectedItems
          .filter(item => item.product.id === product.id)
          .reduce((sum, item) => sum + item.qty, 0);
        const availableStock = (product.stockUnits || 0) - currentInOrder;
        
        if (availableStock <= 0) {
          showToast('warning', `Stock insuficiente. Solo hay ${product.stockUnits || 0} unidades disponibles`);
          return;
        }
      }
      
      // Siempre agregar como nuevo item (NO sumar)
      setSelectedItems(prev => [
        ...prev,
        {
          product,
          qty,
          notes: '',
          discount: 0,
          barcode: metadata?.barcode,
          customUnitPrice: metadata?.customUnitPrice
        }
      ]);
    }
  });

  const activeProducts = products.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async (product: Product) => {
    // VACUUM_PACKED y WEIGHT se tratan igual - no requieren lógica especial

    // Validar stock disponible para productos por unidad
    if (product.saleType === 'UNIT') {
      const currentInOrder = selectedItems
        .filter(item => item.product.id === product.id)
        .reduce((sum, item) => sum + item.qty, 0);
      const availableStock = (product.stockUnits || 0) - currentInOrder;
      
      if (availableStock <= 0) {
        showToast('warning', `Stock insuficiente. Solo hay ${product.stockUnits || 0} unidades disponibles`);
        return;
      }
    }

    // Para todos los productos, agregar directamente
    const existing = selectedItems.find((item) => item.product.id === product.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.product.id === product.id
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
          const price = item.product.price;
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
    if (!selectedCustomer || !deliveryDate || !deliveryTime || selectedItems.length === 0) {
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
      // Crear el pedido directamente - sin lógica de lotes
      const orderItems = selectedItems.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
        discount: item.discount || 0, // Incluir descuento por item
        notes: item.notes || undefined,
      }));

      // Limpiar teléfono para que solo tenga caracteres válidos
      const cleanPhone = (customerPhone || '')?.replace(/[^0-9\s+\-()]/g, '').trim();

      const result = await createOrder({
        customerId: selectedCustomer?.id || '', // Send customer ID
        customerName, // Snapshot
        customerPhone: cleanPhone || undefined, // Snapshot limpio o undefined si está vacío
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
    const unitPrice = item.product.price;
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
      const price = item.product.price;
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
          <div className="space-y-4" style={{ minHeight: '300px' }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Cliente <span className="text-red-500">*</span>
              </label>
              <CustomerSelector
                value={selectedCustomer}
                onChange={(customer) => {
                  setSelectedCustomer(customer);
                  if (customer) {
                    // Fill snapshots
                    setCustomerName((customer.company || customer.name || ''));
                    setCustomerPhone(customer.phone || '');
                  } else {
                    setCustomerName('');
                    setCustomerPhone('');
                  }
                }}
                placeholder="Buscar por nombre, empresa o teléfono..."
                required
              />
            </div>

            <Button
              onClick={() => setStep('products')}
              disabled={!selectedCustomer}
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
            {/* Feedback de Escaneo */}
            {scannerFeedback.show && (
              <div className={`mb-2 px-4 py-2 rounded-lg text-sm font-medium ${
                scannerFeedback.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {scannerFeedback.message}
              </div>
            )}
            
            {/* Vista de dos columnas similar al POS */}
            <div className="grid grid-cols-2 gap-3 overflow-hidden" style={{ height: scannerFeedback.show ? '380px' : '410px' }}>
              {/* Columna izquierda: Productos disponibles */}
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar productos..."
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="w-full p-2 hover:bg-primary-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-0 text-left"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-primary-700 font-semibold text-sm">
                          Bs {Math.round(product.price)}
                        </p>
                        <p className="text-xs text-gray-500">/{product.unit}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Columna derecha: Productos seleccionados */}
              <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-2 bg-primary-600 text-white border-b border-primary-700">
                  <h4 className="font-semibold text-sm">
                    Pedido ({selectedItems.length} {selectedItems.length === 1 ? 'producto' : 'productos'})
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {selectedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p className="text-sm">No hay productos seleccionados</p>
                      <p className="text-xs">Selecciona productos de la lista</p>
                    </div>
                  ) : (
                    selectedItems.map((item, index) => {
                      const currentInOrder = selectedItems
                        .filter(i => i.product.id === item.product.id)
                        .reduce((sum, i) => sum + i.qty, 0);
                      const availableStock = (item.product.stockUnits || 0) - currentInOrder + item.qty;
                      
                      return (
                      <div key={`${item.product.id}-${index}`} className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                            </div>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                            {/* Mostrar stock para productos UNIT */}
                            {item.product.saleType === 'UNIT' && (
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
                        {/* Mostrar controles según tipo de venta */}
                        {item.product.saleType === 'UNIT' ? (
                          /* Productos UNIT: Botones +/- */
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
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
                            <div className="flex items-center justify-between mt-0.5">
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
                            <div className="flex items-center gap-2 mb-0.5">
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
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-gray-500">
                                Bs {Math.round(item.product.price)}/{item.product.unit}
                              </span>
                              <span className="font-semibold text-gray-900 text-sm">
                                Total: Bs {Math.round(item.qty * item.product.price)}
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
                            <div className="flex items-center justify-between mt-0.5">
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
                <div className="p-2 bg-white border-t-2 border-primary-600 space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      Bs {Math.round(selectedItems.reduce((sum, item) => {
                        const price = item.product.price;
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
            <div className="flex gap-3 mt-2">
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

      {/* Modal de descuento */}
      {showDiscountModal && selectedItemForDiscount && (() => {
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
            } as CartItem}
            onClose={() => {
              setShowDiscountModal(false);
              setSelectedItemForDiscount(null);
            }}
            onApplyUnitPrice={(newUnitPrice) => {
              // Aplicar nuevo precio unitario
              const item = selectedItems[selectedItemForDiscount.index];
              if (item) {
                const originalPrice = item.product.price;
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
