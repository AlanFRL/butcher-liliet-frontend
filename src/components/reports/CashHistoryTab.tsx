import React, { useState, useEffect } from 'react';
import { DollarSign, Eye, Printer, Filter, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import Pagination from '../ui/Pagination';
import { useAuthStore, useCashStore } from '../../store';
import { cashSessionsApi } from '../../services/api';
import type { PaginatedResponse, CashSessionResponse } from '../../services/api';
import { CashSessionDetail } from './CashSessionDetail';
import { formatDateBolivia, formatTimeBolivia, formatDateForBackend } from '../../utils/timezone';
import { usePermissions } from '../../hooks/usePermissions';

interface CashSession {
  id: string;
  terminalId: string;
  userId: string;
  openedAt: string;
  closedAt: string | null;
  status: 'OPEN' | 'CLOSED';
  openingAmount: string;
  closingAmount: string | null;
  expectedAmount: string;
  differenceAmount: string | null;
  terminal: {
    id: string;
    name: string;
    location?: string;
  };
  user: {
    id: string;
    fullName: string;
    username: string;
  };
}

interface CashHistoryTabProps {
  dateFrom: string;
  dateTo: string;
}

export const CashHistoryTab: React.FC<CashHistoryTabProps> = ({
  dateFrom,
  dateTo,
}) => {
  const { currentUser } = useAuthStore();
  const { currentSession, deleteSession } = useCashStore();
  const { canDeleteSessions } = usePermissions();
  
  // Debug log
  console.log('🔐 Delete permissions:', {
    isAdmin: currentUser?.role === 'ADMIN',
    canDeleteSessions,
    currentUserRole: currentUser?.role,
  });
  
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sessionMovements, setSessionMovements] = useState<any[]>([]);
  const [sessionSales, setSessionSales] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<CashSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filtros
  const [selectedTerminal, setSelectedTerminal] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Cargar sesiones desde el backend
  useEffect(() => {
    loadSessions();
  }, [dateFrom, dateTo, currentPage, pageSize]);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Usar formatDateForBackend para enviar fechas con offset de Bolivia
      const response = await cashSessionsApi.getAll({
        startDate: formatDateForBackend(dateFrom, false), // Inicio del día
        endDate: formatDateForBackend(dateTo, true), // Fin del día
        page: currentPage,
        limit: pageSize,
      });
      
      // Verificar si la respuesta es paginada
      if ('data' in response) {
        const paginatedResponse = response as PaginatedResponse<CashSessionResponse>;
        
        // Mapear la respuesta del backend al formato esperado
        const mappedSessions: CashSession[] = paginatedResponse.data.map((session) => ({
          id: session.id,
          terminalId: session.terminalId,
          userId: session.userId,
          openedAt: session.openedAt,
          closedAt: session.closedAt,
          status: session.status,
          openingAmount: session.openingAmount,
          closingAmount: session.closingAmount,
          expectedAmount: session.expectedAmount,
          differenceAmount: session.differenceAmount,
          terminal: {
            id: session.terminal?.id || session.terminalId,
            name: session.terminal?.name || 'Terminal',
            location: '', // El backend no devuelve location en la lista
          },
          user: {
            id: session.user?.id || session.userId,
            fullName: session.user?.fullName || 'Usuario',
            username: '', // El backend no devuelve username en la lista
          },
        }));
        
        setSessions(mappedSessions);
        setTotalItems(paginatedResponse.total);
        setTotalPages(paginatedResponse.totalPages);
        console.log('📦 Loaded page', currentPage, 'of', paginatedResponse.totalPages, `(${mappedSessions.length} sessions, ${paginatedResponse.total} total)`);
      } else {
        // Backward compatibility: respuesta sin paginar (array directo)
        const sessionArray = response as CashSessionResponse[];
        const mappedSessions: CashSession[] = sessionArray.map((session) => ({
          id: session.id,
          terminalId: session.terminalId,
          userId: session.userId,
          openedAt: session.openedAt,
          closedAt: session.closedAt,
          status: session.status,
          openingAmount: session.openingAmount,
          closingAmount: session.closingAmount,
          expectedAmount: session.expectedAmount,
          differenceAmount: session.differenceAmount,
          terminal: {
            id: session.terminal?.id || session.terminalId,
            name: session.terminal?.name || 'Terminal',
            location: '',
          },
          user: {
            id: session.user?.id || session.userId,
            fullName: session.user?.fullName || 'Usuario',
            username: '',
          },
        }));
        
        setSessions(mappedSessions);
        setTotalItems(mappedSessions.length);
        setTotalPages(1);
        console.log('📦 Loaded', mappedSessions.length, 'cash sessions (no pagination)');
      }
    } catch (error) {
      console.error('❌ Error loading cash sessions:', error);
      setError('Error al cargar las sesiones de caja');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar sesiones según rol y filtros seleccionados
  const filteredSessions = sessions.filter(session => {
    // Filtro por rol: cajeros solo ven sus propias sesiones
    if (currentUser?.role === 'CASHIER' && session.userId !== currentUser.id) {
      return false;
    }

    // Filtro por terminal
    if (selectedTerminal !== 'all' && session.terminalId !== selectedTerminal) {
      return false;
    }

    // Filtro por usuario (solo para ADMIN/MANAGER)
    if (currentUser?.role !== 'CASHIER' && selectedUser !== 'all' && session.userId !== selectedUser) {
      return false;
    }

    return true;
  });

  // Obtener listas únicas para filtros
  const terminals = Array.from(new Set(sessions.map(s => s.terminal.name)))
    .map(name => sessions.find(s => s.terminal.name === name)!)
    .map(s => ({ id: s.terminalId, name: s.terminal.name }));
  
  const users = Array.from(new Set(sessions.map(s => s.user.username)))
    .map(username => sessions.find(s => s.user.username === username)!)
    .map(s => ({ id: s.userId, name: s.user.fullName }));

  const handleViewDetail = async (session: CashSession) => {
    setSelectedSession(session);
    setIsLoading(true);
    try {
      // Cargar detalles de la sesión
      // El endpoint /sales?sessionId=XXX ya incluye los items
      const [movements, sales] = await Promise.all([
        cashSessionsApi.getMovements(session.id),
        cashSessionsApi.getSales(session.id),
      ]);
      
      console.log('📋 Loaded session details:', {
        sessionId: session.id,
        movementsCount: movements.length,
        salesCount: sales.length,
        movements: movements,
      });
      console.log('📋 Loaded', sales.length, 'sales from session');
      sales.forEach((sale, idx) => {
        console.log(`  Sale ${idx + 1} (${sale.id}): ${sale.items?.length || 0} items`);
      });
      
      setSessionMovements(movements);
      setSessionSales(sales); // Los items ya vienen incluidos
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ Error loading session details:', error);
      setError('Error al cargar los detalles de la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSession = async (session: CashSession) => {
    await handleViewDetail(session);
    // El modal de detalle tiene su propio botón de impresión
  };
  
  const handleDeleteClick = (session: CashSession) => {
    setSessionToDelete(session);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!sessionToDelete || deleteConfirmText !== 'ELIMINAR') return;
    
    setIsDeleting(true);
    try {
      const success = await deleteSession(sessionToDelete.id);
      if (success) {
        setShowDeleteModal(false);
        setSessionToDelete(null);
        setDeleteConfirmText('');
        // Recargar sesiones
        await loadSessions();
        alert('Sesión eliminada correctamente. Se han restaurado todos los inventarios.');
      } else {
        alert('No se pudo eliminar la sesión. Verifica que esté cerrada y no sea la sesión actual.');
      }
    } catch (error) {
      alert('Error al eliminar la sesión');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando historial de cajas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header con filtros */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
              Historial de Cajas
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredSessions.length} sesiones)
              </span>
            </h2>
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
          
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por terminal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terminal
              </label>
              <select
                value={selectedTerminal}
                onChange={(e) => setSelectedTerminal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todas las terminales</option>
                {terminals.map(terminal => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtro por usuario (solo para ADMIN/MANAGER) */}
            {currentUser?.role !== 'CASHIER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todos los usuarios</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        
        {/* Paginación superior */}
        {totalPages > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        
        {/* Tabla de sesiones */}
        <div className="overflow-x-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {sessions.length === 0 
                  ? 'No hay sesiones de caja en el período seleccionado'
                  : 'No hay sesiones que coincidan con los filtros seleccionados'
                }
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Apertura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Cierre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Terminal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo Inicial
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Esperado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo Final
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSessions.map((session) => {
                  const openingBalance = parseFloat(session.openingAmount);
                  const expectedAmount = parseFloat(session.expectedAmount);
                  const closingBalance = session.closingAmount ? parseFloat(session.closingAmount) : 0;
                  const difference = session.differenceAmount ? parseFloat(session.differenceAmount) : 0;
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDateBolivia(new Date(session.openedAt), {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' '}
                        {formatTimeBolivia(new Date(session.openedAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.closedAt ? (
                          <>
                            {formatDateBolivia(new Date(session.closedAt), {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {' '}
                            {formatTimeBolivia(new Date(session.closedAt))}
                          </>
                        ) : (
                          <span className="text-blue-600 font-semibold">ABIERTA</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.user.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{session.user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.terminal.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                        Bs {openingBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-blue-600">
                        Bs {expectedAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                        {session.closedAt ? (
                          `Bs ${closingBalance.toFixed(2)}`
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {session.closedAt ? (
                          <span className={`font-bold ${
                            difference > 0 ? 'text-green-600' : 
                            difference < 0 ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {difference > 0 && '+'}Bs {difference.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            onClick={() => handleViewDetail(session)}
                            variant="outline"
                            size="sm"
                            title="Ver detalle de sesión"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {session.closedAt && (
                            <Button
                              onClick={() => handlePrintSession(session)}
                              variant="outline"
                              size="sm"
                              title="Imprimir arqueo"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteSessions && session.closedAt && session.id !== currentSession?.id ? (
                            <Button
                              onClick={() => handleDeleteClick(session)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              title="Eliminar sesión (ADMIN)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : !canDeleteSessions ? (
                            <span className="text-xs text-gray-400 italic" title="Solo ADMIN puede eliminar">🔒</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación inferior */}
        {!isLoading && !error && totalPages > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => {
                setCurrentPage(page);
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1); // Resetear a página 1 al cambiar tamaño
              }}
            />
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedSession && showDetailModal && (
        <CashSessionDetail
          session={selectedSession}
          movements={sessionMovements}
          sales={sessionSales}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSession(null);
            setSessionMovements([]);
            setSessionSales([]);
          }}
        />
      )}
      
      {/* Modal de confirmación para eliminar sesión */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 ELIMINAR SESIÓN DE CAJA</h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-red-800 font-bold mb-2">
                  ⚠️ ACCIÓN EXTREMADAMENTE PELIGROSA
                </p>
                <p className="text-red-700 text-sm mb-3">
                  Estás a punto de <strong>eliminar COMPLETAMENTE</strong> una sesión de caja.
                  Esta es la operación más destructiva del sistema.
                </p>
                <ul className="text-red-700 text-sm space-y-2">
                  <li>❌ Se eliminarán <strong>TODAS las ventas</strong> de esta sesión</li>
                  <li>❌ Se eliminarán <strong>TODOS los movimientos</strong> (ingresos/retiros)</li>
                  <li>🔄 Se restaurará el inventario de <strong>TODOS los productos vendidos</strong></li>
                  <li>🔄 Todas las órdenes asociadas volverán a estado <strong>LISTO</strong></li>
                  <li>⚠️ Esta acción es <strong>PERMANENTE E IRREVERSIBLE</strong></li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Sesión:</strong> #{sessionToDelete.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Usuario:</strong> {sessionToDelete.user.fullName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Terminal:</strong> {sessionToDelete.terminal.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Apertura:</strong> {formatDateBolivia(new Date(sessionToDelete.openedAt))} {formatTimeBolivia(new Date(sessionToDelete.openedAt))}
                </p>
                {sessionToDelete.closedAt && (
                  <p className="text-sm text-gray-700">
                    <strong>Cierre:</strong> {formatDateBolivia(new Date(sessionToDelete.closedAt))} {formatTimeBolivia(new Date(sessionToDelete.closedAt))}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <strong>Monto esperado:</strong> Bs {parseFloat(sessionToDelete.expectedAmount).toFixed(2)}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-900 font-medium mb-2 text-sm">
                  💡 ¿Cuándo eliminar una sesión?
                </p>
                <ul className="text-yellow-800 text-xs space-y-1">
                  <li>• Cuando se registraron datos de prueba que deben ser removidos</li>
                  <li>• Cuando hubo un error crítico en el registro de la sesión completa</li>
                  <li>• NUNCA para corregir un error menor (usa cancelación de ventas)</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-bold text-red-700 mb-2">
                  Para confirmar, escribe: <span className="font-mono bg-red-100 px-2 py-1 rounded">ELIMINAR</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Escribe ELIMINAR en mayúsculas"
                  className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSessionToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  variant="outline" 
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  variant="danger"
                  className="flex-1"
                  isLoading={isDeleting}
                  disabled={deleteConfirmText !== 'ELIMINAR'}
                >
                  Sí, ELIMINAR Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
