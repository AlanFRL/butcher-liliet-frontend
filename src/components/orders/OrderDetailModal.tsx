import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useOrderStore, useCartStore } from '../../store';
import type { Order, OrderStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onEdit?: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order: initialOrder, onClose, onEdit, showToast }) => {
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
