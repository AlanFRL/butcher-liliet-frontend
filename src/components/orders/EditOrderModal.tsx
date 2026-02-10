import React, { useState } from 'react';
import { Search, Package, XCircle, Tag } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useOrderStore, useProductStore } from '../../store';
import type { Order, Product } from '../../types';
import { ItemDiscountModal } from '../ItemDiscountModal';

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
    discount?: number; // descuento por item
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  const [step, setStep] = useState<'products' | 'details'>('products');
  const [globalDiscount, setGlobalDiscount] = useState(order.discount || 0); // descuento global
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
      };

      const selectedItem: {
        product: Product;
        qty: number;
        notes: string;
        discount?: number;
      } = {
        product: productData,
        qty: item.qty,
        notes: item.notes || '',
        discount: item.discount || 0,
      };

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
    // VACUUM_PACKED y WEIGHT se tratan igual

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

    // Producto normal
    const existing = selectedItems.find(item => item.product.id === product.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map(item =>
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
    const price = item.product.price;
    const itemTotal = Math.round(item.qty * price);
    const itemDiscount = Math.round(item.discount || 0);
    return sum + Math.round(itemTotal - itemDiscount);
  }, 0);
  
  const finalTotal = Math.max(0, totalAmount - globalDiscount);
  
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

  const handleApplyDiscount = (newDiscount: number) => {
    if (selectedItemForDiscount) {
      const updatedItems = [...selectedItems];
      updatedItems[selectedItemForDiscount.index] = {
        ...updatedItems[selectedItemForDiscount.index],
        discount: newDiscount,
      };
      setSelectedItems(updatedItems);
      setShowDiscountModal(false);
      setSelectedItemForDiscount(null);
    }
  };

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
      discount: item.discount || 0,
      notes: item.notes || undefined,
    }));

    const result = await updateOrder(order.id, {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryDate,
      deliveryTime,
      discount: globalDiscount, // Incluir descuento global
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
    <>
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
                        <p className="text-primary-700 font-semibold text-sm">
                          Bs {product.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">/{product.unit}</p>
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
                      <div key={`${item.product.id}-${index}`} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Productos VACUUM_PACKED son editables como cualquier producto WEIGHT */}
                        {false ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">1 paquete</span>
                            <span className="font-semibold text-gray-900 text-sm">
                              Bs {Math.round(item.product.price)}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
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
                              <button
                                onClick={() => handleOpenDiscountModal(index)}
                                className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 border border-yellow-200"
                                title="Aplicar descuento"
                              >
                                <Tag className="w-3 h-3" />
                                {item.discount && item.discount > 0 ? `-Bs ${Math.round(item.discount)}` : 'Desc'}
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              {item.discount && item.discount > 0 ? (
                                <>
                                  <span className="text-gray-500">
                                    Bs {Math.round(item.qty * item.product.price)} - Bs {Math.round(item.discount)}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    Bs {Math.round(item.qty * item.product.price - item.discount)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-gray-500">
                                    {item.qty.toFixed(item.product.saleType === 'WEIGHT' ? 3 : 0)} × Bs {Math.round(item.product.price)}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    Bs {Math.round(item.qty * item.product.price)}
                                  </span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-white border-t border-gray-200 space-y-2">
                  {/* Campo de descuento global */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 flex-shrink-0">Descuento adicional:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-gray-500">Bs</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={globalDiscount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setGlobalDiscount(Math.max(0, Math.min(value, totalAmount)));
                        }}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  {/* Subtotal y total */}
                  {globalDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">Bs {Math.round(totalAmount)}</span>
                    </div>
                  )}
                  {globalDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-red-600">
                      <span>Descuento:</span>
                      <span className="font-semibold">-Bs {Math.round(globalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-primary-700">
                      Bs {Math.round(finalTotal)}
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
                  <span className="text-primary-700">Bs {Math.round(finalTotal)}</span>
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
      </Modal>
    
      {/* Modal de descuento */}
      {showDiscountModal && selectedItemForDiscount && (
        <ItemDiscountModal
          item={{
            id: `discount-${selectedItemForDiscount.index}`,
            productId: selectedItemForDiscount.product.id,
            productName: selectedItemForDiscount.product.name,
            saleType: selectedItemForDiscount.product.saleType,
            unit: selectedItemForDiscount.product.unit,
            qty: selectedItemForDiscount.qty,
            unitPrice: selectedItemForDiscount.unitPrice,
            originalUnitPrice: selectedItemForDiscount.unitPrice,
            discount: selectedItemForDiscount.discount,
            total: Math.round(selectedItemForDiscount.qty * selectedItemForDiscount.unitPrice - selectedItemForDiscount.discount),
            product: selectedItemForDiscount.product,
          }}
          onClose={() => {
            setShowDiscountModal(false);
            setSelectedItemForDiscount(null);
          }}
          onApplyUnitPrice={handleApplyDiscount}
        />
      )}
    </>
  );
};
