import React, { useState, useMemo } from 'react';
import { Plus, Search, Calendar, Clock, Phone, User, Package, AlertCircle, CheckCircle, XCircle, Eye, CreditCard } from 'lucide-react';
import { Button, Modal } from '../components/ui';
import { useOrderStore, useProductStore, useCartStore } from '../store';
import type { Order, OrderStatus, Product } from '../types';
import { useNavigate } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const navigate = useNavigate();
  const { orders, getOverdueOrders, getTodaysDeliveries } = useOrderStore();
  const { loadOrderToCart } = useCartStore();
  const overdueOrders = getOverdueOrders();
  const todaysDeliveries = getTodaysDeliveries();
  
  // Función para cobrar pedido en POS
  const handleChargeOrder = (order: Order) => {
    // Pre-cargar items del pedido al carrito
    loadOrderToCart(order);
    // Navegar al POS con el orderId en el state
    navigate('/pos', { state: { orderId: order.id } });
  };

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filtro por estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toString().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          o.customerPhone.includes(query)
      );
    }

    // Ordenar por fecha de entrega (más próximos primero)
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime}`);
      const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [orders, statusFilter, searchQuery]);

  const getStatusBadge = (status: OrderStatus) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      READY: { color: 'bg-green-100 text-green-800', text: 'Listo' },
      DELIVERED: { color: 'bg-gray-100 text-gray-800', text: 'Entregado' },
      CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
    };
    return badges[status];
  };

  const isOrderOverdue = (order: Order) => {
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') return false;
    const deliveryDateTime = new Date(`${order.deliveryDate}T${order.deliveryTime}`);
    return deliveryDateTime < new Date();
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos y Reservas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los pedidos de clientes y programa entregas
          </p>
        </div>
        <Button
          onClick={() => setShowNewOrderModal(true)}
          variant="primary"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Alertas */}
      {overdueOrders.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">
                {overdueOrders.length} pedido{overdueOrders.length > 1 ? 's' : ''} atrasado{overdueOrders.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700 mt-1">
                Hay pedidos que ya pasaron su fecha de entrega programada
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entregas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todaysDeliveries.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter((o) => o.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Listos</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter((o) => o.status === 'READY').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número, cliente o teléfono..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                statusFilter === 'READY'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Listos
            </button>
            <button
              onClick={() => setStatusFilter('DELIVERED')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                statusFilter === 'DELIVERED'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entregados
            </button>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay pedidos
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No se encontraron pedidos con los filtros aplicados'
              : 'Crea tu primer pedido para comenzar'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <Button onClick={() => setShowNewOrderModal(true)} variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Crear Pedido
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isOverdue = isOrderOverdue(order);
            const statusBadge = getStatusBadge(order.status);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Pedido #{order.orderNumber.toString().padStart(4, '0')}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                      {isOverdue && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Atrasado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.customerPhone}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {new Date(order.deliveryDate).toLocaleDateString('es-BO')} - {order.deliveryTime}
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-600 mt-3 italic">
                        Nota: {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right ml-6">
                    <p className="text-sm text-gray-600 mb-1">{order.items.length} productos</p>
                    <p className="text-2xl font-bold text-primary-700">
                      Bs {Math.round(order.total)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Creado {new Date(order.createdAt).toLocaleDateString('es-BO')} {new Date(order.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex gap-2">
                      {/* Botón Cobrar en POS para pedidos READY */}
                      {order.status === 'READY' && (
                        <Button
                          onClick={() => handleChargeOrder(order)}
                          variant="primary"
                          size="sm"
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Cobrar en POS
                        </Button>
                      )}
                      <Button
                        onClick={() => handleViewOrder(order)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Pedido */}
      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
        />
      )}

      {/* Modal Detalle del Pedido */}
      {showOrderDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

// Modal para crear nuevo pedido
const NewOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Estado local para los inputs de cantidad (permite edición libre)
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});

  const { products } = useProductStore();
  const { createOrder } = useOrderStore();

  const activeProducts = products.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    const existing = selectedItems.find((item) => item.product.id === product.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + (product.saleType === 'WEIGHT' ? 0.5 : 1) }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product,
          qty: product.saleType === 'WEIGHT' ? 0.5 : 1,
          notes: '',
        },
      ]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.product.id !== productId));
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    // Permitir 0 temporalmente mientras escribe, pero no negativos
    if (qty < 0) {
      return;
    }
    
    setSelectedItems(
      selectedItems.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      )
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

  const handleSubmit = () => {
    if (!customerName || !customerPhone || !deliveryDate || !deliveryTime || selectedItems.length === 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    // Validar que no haya items con cantidad 0
    const hasInvalidItems = selectedItems.some(item => item.qty <= 0);
    if (hasInvalidItems) {
      alert('Por favor, ingrese cantidades válidas para todos los productos');
      return;
    }

    const orderItems = selectedItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productSku: item.product.sku,
      saleType: item.product.saleType,
      qty: item.qty,
      unit: item.product.unit,
      unitPrice: item.product.price,
      // Redondear el total al entero más cercano
      total: Math.round(item.qty * item.product.price),
      notes: item.notes || undefined,
    }));

    createOrder(
      '', // customerId (por ahora vacío)
      customerName,
      customerPhone,
      deliveryDate,
      deliveryTime,
      orderItems,
      notes || undefined
    );

    alert('Pedido creado exitosamente');
    onClose();
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.qty * item.product.price,
    0
  );

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
                    selectedItems.map((item) => (
                      <div key={item.product.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(item.product.id)}
                            className="text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
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
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-white border-t-2 border-primary-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary-700">Bs {Math.round(totalAmount)}</span>
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
    </Modal>
  );
};

// Modal de detalle del pedido
const OrderDetailModal: React.FC<{
  order: Order;
  onClose: () => void;
}> = ({ order: initialOrder, onClose }) => {
  const { updateOrderStatus, cancelOrder, getOrderById } = useOrderStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Estado local para reflejar cambios en tiempo real
  const currentOrder = getOrderById(initialOrder.id) || initialOrder;

  const statusBadge = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
    READY: { color: 'bg-green-100 text-green-800', text: 'Listo' },
    DELIVERED: { color: 'bg-gray-100 text-gray-800', text: 'Entregado' },
    CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
  }[currentOrder.status];

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateOrderStatus(currentOrder.id, newStatus);
    if (newStatus === 'DELIVERED') {
      alert('Pedido marcado como entregado');
      onClose();
    }
  };

  const handleCancel = () => {
    if (!cancellationReason.trim()) {
      alert('Debes especificar un motivo de cancelación');
      return;
    }
    cancelOrder(currentOrder.id, cancellationReason);
    alert('Pedido cancelado');
    setShowCancelModal(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={`Pedido #${currentOrder.orderNumber.toString().padStart(4, '0')}`} size="lg">
        <div className="space-y-6">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
            {currentOrder.status !== 'DELIVERED' && currentOrder.status !== 'CANCELLED' && (
              <div className="flex gap-2">
                {currentOrder.status === 'PENDING' && (
                  <Button
                    onClick={() => handleStatusChange('READY')}
                    variant="primary"
                    size="sm"
                  >
                    Marcar como Listo
                  </Button>
                )}
                {currentOrder.status === 'READY' && (
                  <Button
                    onClick={() => handleStatusChange('DELIVERED')}
                    variant="primary"
                    size="sm"
                  >
                    Marcar como Entregado
                  </Button>
                )}
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Cancelar Pedido
                </Button>
              </div>
            )}
          </div>

          {/* Información del cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">{currentOrder.customerName}</p>
              </div>
              <div>
                <p className="text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-900">{currentOrder.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Información de entrega */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Información de Entrega</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Fecha</p>
                <p className="font-medium text-gray-900">
                  {new Date(currentOrder.deliveryDate).toLocaleDateString('es-BO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Hora</p>
                <p className="font-medium text-gray-900">{currentOrder.deliveryTime}</p>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Productos del Pedido</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.productSku}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-600 italic mt-1">Nota: {item.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {item.qty} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        Bs {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        Bs {Math.round(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-primary-700">
                      Bs {Math.round(currentOrder.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notas */}
          {currentOrder.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Notas del Pedido</h4>
              <p className="text-sm text-gray-700">{currentOrder.notes}</p>
            </div>
          )}

          {/* Información adicional */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Creado: {new Date(currentOrder.createdAt).toLocaleString('es-BO')}</p>
            <p>Última actualización: {new Date(currentOrder.updatedAt).toLocaleString('es-BO')}</p>
            {currentOrder.completedAt && <p>Entregado: {new Date(currentOrder.completedAt).toLocaleString('es-BO')}</p>}
            {currentOrder.cancelledAt && (
              <>
                <p>Cancelado: {new Date(currentOrder.cancelledAt).toLocaleString('es-BO')}</p>
                {currentOrder.cancellationReason && <p className="text-red-600">Motivo: {currentOrder.cancellationReason}</p>}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar Pedido"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro que deseas cancelar este pedido? Esta acción no se puede deshacer.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de cancelación <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                placeholder="Explica el motivo de la cancelación..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowCancelModal(false)} variant="outline" className="flex-1">
                Volver
              </Button>
              <Button
                onClick={handleCancel}
                variant="danger"
                className="flex-1"
                disabled={!cancellationReason.trim()}
              >
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
