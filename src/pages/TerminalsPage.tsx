import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { terminalsApi } from '../services/api';
import { useAuthStore } from '../store';

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

export const TerminalsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
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
      alert('Error al cargar terminales');
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
      console.error('Error al crear terminal:', error);
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
      console.error('Error al actualizar terminal:', error);
      alert(error.message || 'Error al actualizar terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (terminal: Terminal) => {
    const action = terminal.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} terminal "${terminal.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await terminalsApi.update(terminal.id, {
        isActive: !terminal.isActive,
      });
      await loadTerminals();
    } catch (error: any) {
      console.error('Error al cambiar estado de terminal:', error);
      alert(error.message || 'Error al cambiar estado de terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerminal = async () => {
    if (!deletingTerminal) return;

    try {
      setLoading(true);
      await terminalsApi.delete(deletingTerminal.id);
      setDeletingTerminal(null);
      await loadTerminals();
    } catch (error: any) {
      console.error('Error al eliminar terminal:', error);
      alert(error.message || 'Error al eliminar terminal');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (terminal: Terminal) => {
    setEditingTerminal(terminal);
    setFormData({
      name: terminal.name,
      location: terminal.location,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
    });
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingTerminal(null);
    setDeletingTerminal(null);
    resetForm();
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 text-lg font-medium">
            No tienes permisos para acceder a esta página
          </p>
          <p className="text-yellow-600 mt-2">
            Solo los administradores pueden gestionar terminales
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Terminales</h1>
          <p className="text-gray-600 mt-1">
            Administra las terminales (cajas registradoras) del sistema
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Crear Terminal
        </button>
      </div>

      {/* Tabla de terminales */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terminal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && terminals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Cargando terminales...
                </td>
              </tr>
            ) : terminals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay terminales registradas
                </td>
              </tr>
            ) : (
              terminals.map((terminal) => (
                <tr key={terminal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{terminal.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{terminal.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        terminal.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {terminal.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        className={`${
                          terminal.isActive
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={terminal.isActive ? 'Desactivar terminal' : 'Activar terminal'}
                      >
                        {terminal.isActive ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingTerminal(terminal)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar terminal"
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

      {/* Modal: Crear Terminal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Terminal</h2>
            </div>
            <form onSubmit={handleCreateTerminal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Terminal *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Piso 1, Entrada principal"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Terminal */}
      {editingTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Terminal</h2>
            </div>
            <form onSubmit={handleUpdateTerminal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Terminal *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Piso 1, Entrada principal"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Actualizar Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {deletingTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirmar Eliminación</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar la terminal{' '}
                <span className="font-semibold">"{deletingTerminal.name}"</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta acción no se puede deshacer. Si hay sesiones de caja asociadas, la
                eliminación podría fallar.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTerminal}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar Terminal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
