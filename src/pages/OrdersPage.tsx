import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Calendar, Clock, Phone, User, Package, AlertCircle, CheckCircle, Eye, CreditCard } from 'lucide-react';
import { Button, useToast } from '../components/ui';
import { useOrderStore, useCartStore } from '../store';
import type { Order, OrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { NewOrderModal } from '../components/orders/NewOrderModal';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { EditOrderModal } from '../components/orders/EditOrderModal';

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
