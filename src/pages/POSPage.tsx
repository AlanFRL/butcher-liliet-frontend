import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Star, Package, Weight, Printer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Modal } from '../components/ui';
import { useProductStore, useCartStore, useCashStore, useSalesStore, useAuthStore } from '../store';
import { ThermalReceiptSale } from '../components/ThermalReceiptSale';
import type { Product, ProductBatch } from '../types';

export const POSPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('CASH');
  const [cashPaid, setCashPaid] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  // Estado local para los inputs de cantidad (permite edición libre)
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  // Estados para modal de lotes
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [availableBatches, setAvailableBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSession } = useCashStore();
  const { currentUser } = useAuthStore();
  const { products, categories, getFavoriteProducts, toggleProductFavorite } = useProductStore();
  const { cartItems, addToCart, addBatchToCart, updateCartItem, removeFromCart, clearCart, getCartTotal } = useCartStore();
  const { completeSale } = useSalesStore();
  
  // Obtener orderId si viene desde pedidos
  const orderId = location.state?.orderId as string | undefined;
  
  // Verificar si hay caja abierta
  if (!currentSession || currentSession.status !== 'OPEN') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">Caja Cerrada</h2>
          <p className="text-yellow-700 mb-4">
            Debes abrir caja antes de poder usar el POS
          </p>
          <Button onClick={() => navigate('/cash/open')} variant="primary">
            Abrir Caja
          </Button>
        </div>
      </div>
    );
  }
  
  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchTerm) {
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });
  
  const favoriteProducts = getFavoriteProducts();
  
  const handleAddToCart = async (product: Product) => {
    // Si es producto al vacío, mostrar modal de selección de lotes
    if (product.inventoryType === 'VACUUM_PACKED') {
      setSelectedProductForBatch(product);
      setShowBatchModal(true);
      await loadBatches(product.id);
      return;
    }
    
    // Verificar stock disponible para productos por unidad
    if (product.saleType === 'UNIT' && product.inventoryType === 'UNIT') {
      const currentInCart = cartItems.find(item => item.productId === product.id)?.qty || 0;
      const availableStock = (product.stockUnits || 0) - currentInCart;
      
      if (availableStock <= 0) {
        alert(`No hay stock disponible de ${product.name}`);
        return;
      }
    }
    
    // Para otros productos, agregar normalmente
    const defaultQty = product.saleType === 'WEIGHT' ? 1 : 1;
    addToCart(product, defaultQty);
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
        // Obtener IDs de lotes ya en el carrito
        const batchIdsInCart = cartItems
          .filter(item => item.batchId)
          .map(item => item.batchId);
        
        // Filtrar solo lotes del producto seleccionado, no vendidos, no reservados y no en carrito
        const filtered = allBatches.filter(
          b => b.productId === productId && 
               !b.isSold && 
               !(b as any).isReserved &&
               !batchIdsInCart.includes(b.id)
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
    
    addBatchToCart(selectedProductForBatch, {
      id: batch.id,
      batchNumber: batch.batchNumber,
      actualWeight: Number(batch.actualWeight),
      unitPrice: Number(batch.unitPrice)
    });
    
    setShowBatchModal(false);
    setSelectedProductForBatch(null);
    setAvailableBatches([]);
  };
  
  // Obtener valor del input (local o del cart)
  const getInputValue = (itemId: string, qty: number, saleType: 'UNIT' | 'WEIGHT') => {
    if (qtyInputs[itemId] !== undefined) {
      return qtyInputs[itemId];
    }
    return saleType === 'WEIGHT' ? qty.toFixed(3) : qty.toString();
  };
  
  // Manejar cambio en input
  const handleQtyInputChange = (itemId: string, value: string) => {
    // Guardar en estado local
    setQtyInputs(prev => ({ ...prev, [itemId]: value }));
  };
  
  // Manejar blur (cuando pierde foco)
  const handleQtyInputBlur = (itemId: string, saleType: 'UNIT' | 'WEIGHT') => {
    const inputValue = qtyInputs[itemId] || '';
    const normalizedValue = inputValue.replace(',', '.');
    
    let finalQty: number;
    
    if (saleType === 'UNIT') {
      // Unidades: debe ser entero >= 1
      const parsed = parseInt(normalizedValue, 10);
      finalQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
      
      // Verificar stock disponible para productos por unidad
      const cartItem = cartItems.find(item => item.id === itemId);
      if (cartItem && cartItem.product.inventoryType === 'UNIT' && cartItem.product.stockUnits !== undefined) {
        const maxStock = cartItem.product.stockUnits;
        if (finalQty > maxStock) {
          alert(`Stock insuficiente. Solo hay ${maxStock} unidades disponibles de ${cartItem.product.name}`);
          finalQty = maxStock;
        }
      }
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
    
    // Actualizar cart y limpiar estado local
    updateCartItem(itemId, finalQty);
    setQtyInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[itemId];
      return newInputs;
    });
  };
  
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Validar que no haya items con cantidad 0
    const hasInvalidItems = cartItems.some(item => item.qty <= 0);
    if (hasInvalidItems) {
      alert('Por favor, ingrese cantidades válidas para todos los productos');
      return;
    }
    
    // Pre-llenar con el total si es efectivo
    if (paymentMethod === 'CASH') {
      setCashPaid(Math.round(getCartTotal()).toString());
    }
    
    setShowPaymentModal(true);
  };
  
  const handleCompleteSale = async () => {
    const sale = await completeSale(
      paymentMethod,
      paymentMethod === 'CASH' ? parseFloat(cashPaid) : undefined,
      orderId // Vincular con pedido si existe
    );
    
    if (sale) {
      setLastSale(sale);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCashPaid('');
      
      // Si venía de un pedido, redirigir a pedidos después
      if (orderId) {
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/orders', { replace: true });
        }, 2000);
      }
    }
  };
  
  const handleNewSale = () => {
    setShowSuccessModal(false);
    setLastSale(null);
    
    // Si venía de un pedido, volver a pedidos
    if (orderId) {
      navigate('/orders', { replace: true });
    }
  };
  
  const handlePrintReceipt = () => {
    window.print();
  };
  
  const getUserDisplayName = () => {
    if (!currentUser) return 'N/A';
    return currentUser.fullName || currentUser.username;
  };
  
  const cartTotal = Math.round(getCartTotal());
  const cashPaidNum = Math.round(parseFloat(cashPaid) || 0);
  const change = cashPaidNum - cartTotal;
  const canCompleteSale =
    paymentMethod === 'CASH' ? cashPaidNum >= cartTotal : true;
  
  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Panel Izquierdo: Productos */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Indicador si viene de pedido */}
        {orderId && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-blue-800">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-medium">Cobrando pedido - Items pre-cargados</span>
              </div>
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
        
        {/* Barra de búsqueda */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>
        </div>
        
        {/* Categorías */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Productos Favoritos */}
        {!searchTerm && !selectedCategory && favoriteProducts.length > 0 && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <Star className="w-4 h-4 mr-1 text-accent-500 fill-current" />
              Favoritos
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2" style={{ maxHeight: '200px', flexWrap: 'wrap' }}>
                {favoriteProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="bg-accent-50 border-2 border-accent-300 rounded-lg p-3 hover:bg-accent-100 transition-all text-left flex-shrink-0"
                    style={{ minWidth: '160px', maxWidth: '200px' }}
                  >
                    <p className="font-bold text-gray-900 text-sm mb-1 truncate">
                      {product.name}
                    </p>
                    <p className="text-accent-700 font-semibold">
                      Bs {product.price.toFixed(2)}/{product.unit}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              // Calcular stock disponible para productos por unidad
              const currentInCart = cartItems.find(item => item.productId === product.id)?.qty || 0;
              const availableStock = product.saleType === 'UNIT' && product.inventoryType === 'UNIT' && product.stockUnits !== undefined
                ? product.stockUnits - currentInCart
                : null;
              const isOutOfStock = availableStock !== null && availableStock <= 0;
              
              return (
              <div
                key={product.id}
                className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all relative group ${isOutOfStock ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProductFavorite(product.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-accent-50 transition-colors"
                  title={product.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Star className={`w-4 h-4 ${product.isFavorite ? 'text-accent-500 fill-current' : 'text-gray-300'}`} />
                </button>
                
                {/* Indicador de stock */}
                {availableStock !== null && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      availableStock <= 0 ? 'bg-red-100 text-red-700' :
                      availableStock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {availableStock <= 0 ? 'Sin stock' : `Stock: ${availableStock}`}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full text-left"
                  disabled={isOutOfStock}
                >
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 pr-8 mt-6">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary-700">
                      Bs {product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">por {product.unit}</p>
                  </div>
                  {!isOutOfStock && (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                </button>
              </div>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Panel Derecho: Carrito */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Header del Carrito */}
        <div className="p-4 border-b border-gray-200 bg-primary-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2 text-primary-600" />
              Carrito
            </h2>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpiar
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">{cartItems.length} items</p>
        </div>
        
        {/* Items del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">El carrito está vacío</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {item.productName}
                    </h4>
                    {item.batchNumber && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Package className="w-3 h-3 mr-1" />
                        Lote: {item.batchNumber}
                        {item.actualWeight && (
                          <span className="ml-2">
                            ({Number(item.actualWeight).toFixed(3)} kg)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Si es lote, no permitir cambiar cantidad (siempre 1) */}
                {item.batchId ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Cantidad: 1 paquete
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-700">
                        Bs {Math.round(item.total)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const step = item.product.saleType === 'UNIT' ? 1 : 0.5;
                          const newQty = item.qty - step;
                          if (newQty > 0) updateCartItem(item.id, newQty);
                        }}
                        className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    <input
                      type="text"
                      value={getInputValue(item.id, item.qty, item.product.saleType)}
                      onChange={(e) => handleQtyInputChange(item.id, e.target.value)}
                      onBlur={() => handleQtyInputBlur(item.id, item.product.saleType)}
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
                        if (item.product.saleType === 'UNIT' && item.product.inventoryType === 'UNIT' && item.product.stockUnits !== undefined) {
                          if (newQty > item.product.stockUnits) {
                            alert(`Stock insuficiente. Solo hay ${item.product.stockUnits} unidades disponibles`);
                            return;
                          }
                        }
                        
                        updateCartItem(item.id, newQty);
                      }}
                      className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500">{item.product.unit}</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Bs {item.unitPrice.toFixed(2)}/{item.product.unit}
                    </p>
                    <p className="text-lg font-bold text-primary-700">
                      Bs {Math.round(item.total)}
                    </p>
                  </div>
                </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Total y Pagar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                Bs {Math.round(cartTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-gray-900">TOTAL:</span>
              <span className="text-primary-700">Bs {Math.round(cartTotal)}</span>
            </div>
          </div>
          
          <Button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            variant="primary"
            size="xl"
            className="w-full"
          >
            <ShoppingCart className="w-6 h-6 mr-2" />
            Cobrar
          </Button>
        </div>
      </div>
      
      {/* Modal de Pago */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Procesar Pago"
        size="md"
      >
        <div className="space-y-6">
          {/* Resumen de items para la nota de venta */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de Venta</h3>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product.name} x {item.qty.toFixed(item.product.saleType === 'WEIGHT' ? 3 : 0)} {item.product.unit}
                    {item.batchNumber && <span className="text-xs text-gray-500 ml-1">(Lote: {item.batchNumber})</span>}
                  </span>
                  <span className="font-semibold">Bs {(item.qty * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
            <p className="text-sm text-gray-600 mb-1">Total a Cobrar</p>
            <p className="text-4xl font-bold text-primary-700">
              Bs {cartTotal}
            </p>
          </div>
          
          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Transferencia
              </button>
            </div>
          </div>
          
          {/* Pago en Efectivo */}
          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efectivo Recibido
              </label>
              <input
                type="number"
                value={cashPaid}
                onChange={(e) => setCashPaid(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              
              {change >= 0 && cashPaidNum > 0 && (
                <div className="mt-4 bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Cambio</p>
                  <p className="text-3xl font-bold text-green-700">
                    Bs {change}
                  </p>
                </div>
              )}
              
              {change < 0 && cashPaidNum > 0 && (
                <div className="mt-4 bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    Efectivo insuficiente. Faltan Bs {Math.abs(change)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Botones de Acción */}
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={!canCompleteSale}
              variant="success"
              size="lg"
              className="flex-1"
            >
              Confirmar Venta
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal de Éxito - Reporte de Venta */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="text-xl font-bold text-gray-900">
                ¡Venta Exitosa!
              </h3>
              <button
                onClick={handleNewSale}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Mensaje de éxito (no se imprime) */}
            <div className="text-center mb-4 no-print">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                Venta Completada
              </p>
              <p className="text-sm text-gray-600">
                Venta registrada exitosamente
              </p>
            </div>
            
            {/* Vista previa de la nota de venta (se imprimirá) */}
            <div className="overflow-y-auto flex-1">
              <ThermalReceiptSale
                data={{
                  saleId: lastSale.id,
                  date: new Date(lastSale.createdAt).toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }),
                  time: new Date(lastSale.createdAt).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  cashier: getUserDisplayName(),
                  items: lastSale.items.map((item: any) => ({
                    name: item.productName,
                    quantity: item.qty,
                    unit: item.unit,
                    price: item.unitPrice,
                    subtotal: item.total,
                    batchNumber: item.batchNumber,
                    actualWeight: item.actualWeight,
                  })),
                  subtotal: lastSale.subtotal,
                  discount: lastSale.discount || 0,
                  total: lastSale.total,
                  paymentMethod: lastSale.paymentMethod,
                  cashPaid: lastSale.cashAmount || undefined,
                  change: lastSale.changeAmount || undefined,
                }}
              />
            </div>
            
            {/* Botones de acción (no se imprimen) */}
            <div className="flex space-x-3 mt-4 no-print">
              <Button 
                onClick={handlePrintReceipt} 
                variant="primary" 
                size="lg" 
                className="flex-1 flex items-center justify-center"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleNewSale} variant="outline" size="lg" className="flex-1">
                Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Lotes */}
      <Modal
        isOpen={showBatchModal}
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando lotes disponibles...</p>
            </div>
          ) : availableBatches.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay lotes disponibles</p>
              <p className="text-sm text-gray-500">
                Debe agregar lotes desde la sección de Inventario
              </p>
              <Button
                onClick={() => {
                  setShowBatchModal(false);
                  navigate('/inventory');
                }}
                variant="secondary"
                className="mt-4"
              >
                Ir a Inventario
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Seleccione el paquete que desea vender:
              </p>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {availableBatches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => handleSelectBatch(batch)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {batch.batchNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Empacado: {new Date(batch.packedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          Bs {Number(batch.unitPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Weight className="w-4 h-4 mr-1" />
                        {Number(batch.actualWeight).toFixed(3)} kg
                      </div>
                      {batch.expiryDate && (
                        <div className="text-gray-500">
                          Vence: {new Date(batch.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
