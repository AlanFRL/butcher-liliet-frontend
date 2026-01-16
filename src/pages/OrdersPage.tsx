import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Calendar, Clock, Phone, User, Package, AlertCircle, CheckCircle, XCircle, Eye, CreditCard } from 'lucide-react';
import { Button, Modal, useToast } from '../components/ui';
import { useOrderStore, useProductStore, useCartStore } from '../store';
import type { Order, OrderStatus, Product, ProductBatch } from '../types';
import { useNavigate } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast, ToastComponent } = useToast();

  const navigate = useNavigate();
  const { orders, error, loadOrders, getOverdueOrders } = useOrderStore();
  const { loadOrderToCart } = useCartStore();
  const overdueOrders = getOverdueOrders();

  // Cargar pedidos al montar el componente
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Mostrar error si ocurre
  useEffect(() => {
    if (error) {
      showToast('error', `Error al cargar pedidos: ${error}`);
    }
  }, [error, showToast]);
  
  // Contar entregas completadas hoy
  const todaysDelivered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(
      (o) => o.status === 'DELIVERED' && 
             o.completedAt && 
             o.completedAt.split('T')[0] === today
    ).length;
  }, [orders]);
  
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

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditOrderModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {ToastComponent}
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
              <p className="text-2xl font-bold text-gray-900">{todaysDelivered}</p>
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
                      {/* Botón Editar para pedidos PENDING o READY */}
                      {(order.status === 'PENDING' || order.status === 'READY') && (
                        <Button
                          onClick={() => handleEditOrder(order)}
                          variant="outline"
                          size="sm"
                        >
                          Editar
                        </Button>
                      )}
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
          showToast={showToast}
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
          onEdit={() => {
            setShowOrderDetailModal(false);
            setShowEditOrderModal(true);
          }}
          showToast={showToast}
        />
      )}

      {/* Modal Editar Pedido */}
      {showEditOrderModal && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => {
            setShowEditOrderModal(false);
            setSelectedOrder(null);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// Modal para crear nuevo pedido
const NewOrderModal: React.FC<{ 
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}> = ({ onClose, showToast }) => {
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
    batchId?: string;
    batchNumber?: string;
    actualWeight?: number;
    batchPrice?: number;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Estado local para los inputs de cantidad (permite edición libre)
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  // Estados para modal de lotes
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [availableBatches, setAvailableBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

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
      const response = await fetch('http://localhost:3000/api/product-batches?includeReservationStatus=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });
      
      if (response.ok) {
        const allBatches: ProductBatch[] = await response.json();
        // Obtener IDs de lotes ya seleccionados
        const batchIdsInOrder = selectedItems
          .filter(item => item.batchId)
          .map(item => item.batchId);
        
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

    const orderItems = selectedItems.map((item) => ({
      productId: item.product.id,
      qty: item.qty,
      notes: item.notes || undefined,
      batchId: item.batchId, // Incluir batchId si existe
    }));

    const result = await createOrder({
      customerName,
      customerPhone,
      items: orderItems,
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
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => {
      const price = item.batchPrice || item.product.price;
      return sum + item.qty * price;
    },
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
                                📦 {item.batchNumber} ({item.actualWeight} kg)
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
                        {/* Si es lote, mostrar solo info (no editable) */}
                        {item.batchId ? (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">1 paquete</span>
                            <span className="font-semibold text-gray-900 text-sm">
                              Bs {Math.round(item.batchPrice || 0)}
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
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No hay lotes disponibles</p>
                <p className="text-sm text-gray-500 mt-2">
                  Todos los lotes de este producto están vendidos o ya están en el pedido.
                </p>
                <Button
                  onClick={() => {
                    setShowBatchModal(false);
                    setSelectedProductForBatch(null);
                    setAvailableBatches([]);
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Selecciona el paquete específico que deseas agregar al pedido
                </p>
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
                          Bs {Number(batch.unitPrice).toFixed(2)}
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
    </Modal>
  );
};

// Modal de detalle del pedido
const OrderDetailModal: React.FC<{
  order: Order;
  onClose: () => void;
  onEdit?: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}> = ({ order: initialOrder, onClose, onEdit, showToast }) => {
  const navigate = useNavigate();
  const { updateOrderStatus, cancelOrder, getOrderById } = useOrderStore();
  const { loadOrderToCart } = useCartStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Estado local para reflejar cambios en tiempo real
  const currentOrder = getOrderById(initialOrder.id) || initialOrder;

  const handleChargeOrder = () => {
    // Pre-cargar items del pedido al carrito
    loadOrderToCart(currentOrder);
    // Navegar al POS con el orderId en el state
    navigate('/pos', { state: { orderId: currentOrder.id } });
    onClose();
  };

  const statusBadge = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
    READY: { color: 'bg-green-100 text-green-800', text: 'Listo' },
    DELIVERED: { color: 'bg-gray-100 text-gray-800', text: 'Entregado' },
    CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
  }[currentOrder.status];

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === 'DELIVERED') {
      // Mostrar modal de confirmación
      setShowDeliverModal(true);
    } else {
      updateOrderStatus(currentOrder.id, newStatus);
    }
  };

  const handleDeliverWithoutCharge = () => {
    updateOrderStatus(currentOrder.id, 'DELIVERED');
    showToast('success', 'Pedido marcado como entregado sin registro de venta');
    setShowDeliverModal(false);
    onClose();
  };

  const handleCancel = () => {
    if (!cancellationReason.trim()) {
      showToast('warning', 'Debes especificar un motivo de cancelación');
      return;
    }
    cancelOrder(currentOrder.id, cancellationReason);
    showToast('success', 'Pedido cancelado');
    setShowCancelModal(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={`Pedido #${currentOrder.orderNumber.toString().padStart(4, '0')}`} size="lg">
        <div className="space-y-6">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
              {/* Badge de pago */}
              {currentOrder.saleId && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                  💵 Pagado
                </span>
              )}
              {currentOrder.status === 'DELIVERED' && !currentOrder.saleId && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                  ⚠️ Sin cobro
                </span>
              )}
            </div>
            {currentOrder.status !== 'DELIVERED' && currentOrder.status !== 'CANCELLED' && (
              <div className="flex gap-2">
                {(currentOrder.status === 'PENDING' || currentOrder.status === 'READY') && onEdit && (
                  <Button
                    onClick={() => onEdit(currentOrder)}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                )}
                {currentOrder.status === 'READY' && (
                  <Button
                    onClick={handleChargeOrder}
                    variant="primary"
                    size="sm"
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    Cobrar en POS
                  </Button>
                )}
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
                    variant="outline"
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
            {/* Botón para ver venta si existe */}
            {currentOrder.saleId && (
              <Button
                onClick={() => {
                  showToast('info', `Venta asociada - Funcionalidad próximamente`);
                  // TODO: Navegar a página de detalles de venta cuando exista
                  // navigate('/sales/' + currentOrder.saleId);
                }}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                📄 Ver Venta
              </Button>
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
                        {item.batchId && item.batch && (
                          <p className="text-xs text-blue-600 mt-1">
                            📦 Lote: {item.batch.batchNumber} ({typeof item.batch.actualWeight === 'string' ? parseFloat(item.batch.actualWeight).toFixed(3) : item.batch.actualWeight.toFixed(3)} kg)
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-gray-600 italic mt-1">Nota: {item.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {item.batchId ? `1 paquete` : `${item.qty} ${item.unit}`}
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

      {/* Modal de confirmación para marcar como entregado sin cobrar */}
      {showDeliverModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeliverModal(false)}
          title="⚠️ Marcar como Entregado"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium mb-2">
                ⚠️ ADVERTENCIA
              </p>
              <p className="text-yellow-700 text-sm">
                Al marcar este pedido como entregado <strong>NO se generará un registro de venta</strong>.
                Esto significa que no habrá ingreso registrado en el sistema.
              </p>
            </div>

            <p className="text-gray-600">
              Si el cliente pagó o pagará, debes usar el botón <strong>"Cobrar en POS"</strong> para registrar la venta correctamente.
            </p>

            <p className="text-gray-600">
              ¿Estás seguro que deseas marcar como entregado sin cobrar?
            </p>

            <div className="flex gap-3">
              <Button onClick={() => setShowDeliverModal(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleDeliverWithoutCharge}
                variant="primary"
                className="flex-1"
              >
                Sí, Marcar como Entregado
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// Modal para editar pedido existente
const EditOrderModal: React.FC<{
  order: Order;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}> = ({ order, onClose, showToast }) => {
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
      const response = await fetch('http://localhost:3000/api/product-batches?includeReservationStatus=true', {
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
