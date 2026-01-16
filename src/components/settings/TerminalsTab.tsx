import React, { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Trash2, Monitor } from 'lucide-react';
import { terminalsApi } from '../../services/api';
import { useAppStore } from '../../store';

interface Terminal {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

interface TerminalFormData {
  name: string;
  location: string;
}

export const TerminalsTab: React.FC = () => {
  const { currentTerminal } = useAppStore();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [deletingTerminal, setDeletingTerminal] = useState<Terminal | null>(null);
  const [formData, setFormData] = useState<TerminalFormData>({
    name: '',
    location: '',
  });

  useEffect(() => {
    loadTerminals();
  }, []);

  const loadTerminals = async () => {
    try {
      setLoading(true);
      const data = await terminalsApi.getAll();
      setTerminals(data);
    } catch (error) {
      console.error('Error al cargar terminales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      alert('Nombre y ubicación son requeridos');
      return;
    }

    try {
      setLoading(true);
      await terminalsApi.create({
        name: formData.name.trim(),
        location: formData.location.trim(),
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadTerminals();
    } catch (error: any) {
      alert(error.message || 'Error al crear terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerminal) return;

    if (!formData.name.trim() || !formData.location.trim()) {
      alert('Nombre y ubicación son requeridos');
      return;
    }

    try {
      setLoading(true);
      await terminalsApi.update(editingTerminal.id, {
        name: formData.name.trim(),
        location: formData.location.trim(),
      });
      setEditingTerminal(null);
      resetForm();
      await loadTerminals();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (terminal: Terminal) => {
    const action = terminal.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} terminal "${terminal.name}"?`)) return;

    try {
      setLoading(true);
      await terminalsApi.update(terminal.id, { isActive: !terminal.isActive });
      await loadTerminals();
    } catch (error: any) {
      alert(error.message || 'Error al cambiar estado de terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerminal = async () => {
    if (!deletingTerminal) return;

    // Validación: no eliminar la terminal actual
    if (currentTerminal && deletingTerminal.id === currentTerminal.id) {
      alert('No puedes eliminar la terminal en la que estás trabajando actualmente.\n\nPor favor, selecciona otra terminal antes de eliminar esta.');
      setDeletingTerminal(null);
      return;
    }

    try {
      setLoading(true);
      await terminalsApi.delete(deletingTerminal.id);
      setDeletingTerminal(null);
      await loadTerminals();
      alert('Terminal eliminada correctamente');
    } catch (error: any) {
      console.error('Error al eliminar terminal:', error);
      if (error.statusCode === 400 || error.message.includes('sesiones') || error.message.includes('asociada')) {
        alert(
          'No se puede eliminar esta terminal porque tiene registros asociados:\n\n' +
          '• Sesiones de caja (abiertas o cerradas)\n' +
          '• Ventas realizadas\n' +
          '• Movimientos de efectivo\n\n' +
          'En su lugar, puedes desactivarla para que no aparezca en la selección de terminales.'
        );
      } else {
        alert(error.message || 'Error al eliminar terminal');
      }
      setDeletingTerminal(null);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (terminal: Terminal) => {
    setEditingTerminal(terminal);
    setFormData({ name: terminal.name, location: terminal.location });
  };

  const resetForm = () => {
    setFormData({ name: '', location: '' });
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingTerminal(null);
    setDeletingTerminal(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Terminales</h2>
          <p className="text-gray-600 mt-1">Administra las cajas registradoras</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Crear Terminal
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && terminals.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : terminals.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay terminales</td></tr>
            ) : (
              terminals.map((terminal) => (
                <tr key={terminal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{terminal.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{terminal.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${terminal.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {terminal.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(terminal)} 
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar terminal"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(terminal)}
                        className={`${terminal.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        title={terminal.isActive ? 'Desactivar terminal' : 'Activar terminal'}
                      >
                        {terminal.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => setDeletingTerminal(terminal)} 
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar terminal permanentemente"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Crear Terminal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Terminal</h2>
            </div>
            <form onSubmit={handleCreateTerminal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Terminal *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Caja 1, Terminal Principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Planta baja, Área de ventas"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Creando...' : 'Crear Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Terminal */}
      {editingTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Terminal: {editingTerminal.name}</h2>
            </div>
            <form onSubmit={handleUpdateTerminal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Terminal *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Eliminación de Terminal */}
      {deletingTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-900">⚠️ Confirmar Eliminación</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas <strong className="text-red-600">eliminar permanentemente</strong> la terminal <strong>"{deletingTerminal.name}"</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Advertencia importante:</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Esta acción NO se puede deshacer</li>
                  <li>Si la terminal tiene sesiones de caja o ventas, NO podrá eliminarse</li>
                  <li>No puedes eliminar la terminal en la que estás trabajando</li>
                  <li>En caso de error, considera <strong>desactivarla</strong> en lugar de eliminarla</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Si solo quieres ocultarla de la selección, usa el botón <strong>"Desactivar"</strong> en lugar de eliminar.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingTerminal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTerminal}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
