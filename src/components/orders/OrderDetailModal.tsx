import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CreditCard, FileText, Trash2 } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useOrderStore, useCartStore, useCashStore } from '../../store';
import type { Order, OrderStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { PrintableInvoiceNote } from './PrintableInvoiceNote';
import { usePermissions } from '../../hooks/usePermissions';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onEdit?: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order: initialOrder, onClose, onEdit, showToast }) => {
  const navigate = useNavigate();
  const { updateOrderStatus, cancelOrder, deleteOrder, getOrderById } = useOrderStore();
  const { loadOrderToCart } = useCartStore();
  const { currentSession } = useCashStore();
  const { canDeleteOrders } = usePermissions();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado local para reflejar cambios en tiempo real
  const currentOrder = getOrderById(initialOrder.id) || initialOrder;
  
  // Verificar si la orden puede ser eliminada
  const canDelete = canDeleteOrders && 
    !currentOrder.saleId && 
    currentSession?.status === 'OPEN' &&
    new Date(currentOrder.createdAt) >= new Date(currentSession.openedAt);

  const handleChargeOrder = () => {
    // Pre-cargar items del pedido al carrito
    loadOrderToCart(currentOrder);
    // Navegar al POS con el orderId en el state
    navigate('/pos', { state: { orderId: currentOrder.id } });
    onClose();
  };

  const handlePrintInvoice = () => {
    // Crear iframe oculto para impresión
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write('<!DOCTYPE html><html><head><title>Nota de Venta</title></head><body><div id="root"></div></body></html>');
    iframeDoc.close();

    const rootElement = iframeDoc.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(<PrintableInvoiceNote order={currentOrder} />);

      // Esperar a que se renderice y luego imprimir
      setTimeout(() => {
        printIframe.contentWindow?.print();

        // Limpiar después de imprimir
        setTimeout(() => {
          document.body.removeChild(printIframe);
        }, 100);
      }, 500);
    }
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteOrder(currentOrder.id);
      if (success) {
        showToast('success', 'Pedido eliminado correctamente');
        setShowDeleteModal(false);
        onClose();
      } else {
        showToast('error', 'No se pudo eliminar el pedido. Verifica que no tenga venta asociada.');
      }
    } catch (error) {
      showToast('error', 'Error al eliminar el pedido');
    } finally {
      setIsDeleting(false);
    }
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
            <div className="flex flex-wrap gap-2">
              {/* Botones de acción normales - solo si no está cancelado */}
              {currentOrder.status !== 'CANCELLED' && (
                <>
                  {/* Botón para editar - solo PENDING o READY */}
                  {(currentOrder.status === 'PENDING' || currentOrder.status === 'READY') && onEdit && (
                    <Button
                      onClick={() => onEdit(currentOrder)}
                      variant="outline"
                      size="sm"
                    >
                      Editar
                    </Button>
                  )}
                  
                  {/* Botón para cobrar en POS - READY o DELIVERED sin pago */}
                  {(currentOrder.status === 'READY' || 
                    (currentOrder.status === 'DELIVERED' && !currentOrder.saleId)) && (
                    <Button
                      onClick={handleChargeOrder}
                      variant="primary"
                      size="sm"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Cobrar en POS
                    </Button>
                  )}
                  
                  {/* Botón para nota de venta - READY o DELIVERED (con o sin pago) */}
                  {(currentOrder.status === 'READY' || currentOrder.status === 'DELIVERED') && (
                    <Button
                      onClick={handlePrintInvoice}
                      variant="outline"
                      size="sm"
                      className="text-primary-600 border-primary-600 hover:bg-primary-50"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nota de Venta
                    </Button>
                  )}
                  
                  {/* Botón marcar como listo */}
                  {currentOrder.status === 'PENDING' && (
                    <Button
                      onClick={() => handleStatusChange('READY')}
                      variant="primary"
                      size="sm"
                    >
                      Marcar como Listo
                    </Button>
                  )}
                  
                  {/* Botón marcar como entregado - solo si no está entregado */}
                  {currentOrder.status === 'READY' && (
                    <Button
                      onClick={() => handleStatusChange('DELIVERED')}
                      variant="outline"
                      size="sm"
                    >
                      Marcar como Entregado
                    </Button>
                  )}
                  
                  {/* Botón cancelar - solo si no está entregado ni cancelado */}
                  {currentOrder.status !== 'DELIVERED' && (
                    <Button
                      onClick={() => setShowCancelModal(true)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Cancelar Pedido
                    </Button>
                  )}
                </>
              )}
              
              {/* Botón eliminar - disponible SIEMPRE si cumple condiciones (incluso cancelados) */}
              {canDelete && (
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar Pedido
                </Button>
              )}
            </div>
            {/* Mostrar ID de venta si existe */}
            {currentOrder.saleId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <span className="text-blue-700 font-medium">ID Venta:</span>
                <span className="text-blue-900 font-mono">{currentOrder.saleId.slice(-8)}</span>
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
                  {(() => {
                    const [year, month, day] = currentOrder.deliveryDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('es-BO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                  })()}
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
                  {currentOrder.items.map((item) => {
                    const itemDiscount = item.discount || 0;
                    const itemSubtotalBeforeDiscount = Math.round(item.qty * item.unitPrice);
                    const itemFinalTotal = Math.round(item.total);
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.productSku}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 italic mt-1">Nota: {item.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900">
                          {`${item.qty} ${item.unit}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-gray-900">Bs {Math.round(item.unitPrice)}</p>
                          {itemDiscount > 0 && (
                            <>
                              <p className="text-xs text-gray-500">Subtotal: Bs {itemSubtotalBeforeDiscount}</p>
                              <p className="text-xs text-red-600">Descuento: -Bs {Math.round(itemDiscount)}</p>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          Bs {itemFinalTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  {currentOrder.discount && currentOrder.discount > 0 ? (
                    <>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-600">
                          Subtotal:
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                          Bs {Math.round(currentOrder.subtotal || currentOrder.total)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm text-red-600">
                          Descuento Global:
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-red-600">
                          -Bs {Math.round(currentOrder.discount)}
                        </td>
                      </tr>
                    </>
                  ) : null}
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-primary-700">
                      Bs&nbsp;{Math.round(currentOrder.total)}
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

      {/* Modal de confirmación para eliminar pedido */}
      {showDeleteModal && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="🗑️ Eliminar Pedido"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro que deseas eliminar este pedido?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ ADVERTENCIA
              </p>
              <p className="text-red-700 text-sm">
                Esta acción es <strong>permanente</strong> y no se puede deshacer.
                El pedido y sus items serán eliminados completamente del sistema.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-gray-700">
                <strong>Pedido:</strong> #{currentOrder.orderNumber.toString().padStart(4, '0')}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Cliente:</strong> {currentOrder.customerName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Total:</strong> Bs {Math.round(currentOrder.total)}
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setShowDeleteModal(false)} 
                variant="outline" 
                className="flex-1"
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                className="flex-1"
                isLoading={isDeleting}
              >
                Sí, Eliminar Pedido
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
