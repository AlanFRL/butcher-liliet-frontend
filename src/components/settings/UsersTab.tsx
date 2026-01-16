import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, UserCheck, UserX, Trash2 } from 'lucide-react';
import { usersApi } from '../../services/api';
import type { UserResponse } from '../../types';
import { useAuthStore } from '../../store';

interface UserFormData {
  username: string;
  fullName: string;
  pin: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
}

export const UsersTab: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    fullName: '',
    pin: '',
    password: '',
    role: 'CASHIER',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }

    try {
      setLoading(true);
      await usersApi.create({
        username: formData.username,
        fullName: formData.fullName,
        pin: formData.pin,
        password: formData.password || undefined,
        role: formData.role,
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (formData.pin && (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin))) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
      };

      if (formData.pin) updateData.pin = formData.pin;
      if (formData.password) updateData.password = formData.password;

      await usersApi.update(editingUser.id, updateData);
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserResponse) => {
    if (user.id === currentUser?.id) {
      alert('No puedes desactivar tu propio usuario');
      return;
    }

    if (!confirm(user.isActive ? `¿Desactivar usuario "${user.username}"?` : `¿Activar usuario "${user.username}"?`)) return;

    try {
      setLoading(true);
      if (user.isActive) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.update(user.id, { isActive: true });
      }
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al cambiar estado del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    if (deletingUser.id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario');
      setDeletingUser(null);
      return;
    }

    try {
      setLoading(true);
      await usersApi.delete(deletingUser.id);
      setDeletingUser(null);
      await loadUsers();
      alert('Usuario eliminado correctamente');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      if (error.statusCode === 400 || error.message.includes('asociados')) {
        alert(
          'No se puede eliminar este usuario porque tiene registros asociados (ventas, sesiones de caja, etc.).\n\n' +
          'En su lugar, puedes desactivarlo para que no pueda iniciar sesión.'
        );
      } else {
        alert(error.message || 'Error al eliminar usuario');
      }
      setDeletingUser(null);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserResponse) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      pin: '',
      password: '',
      role: user.role,
    });
  };

  const resetForm = () => {
    setFormData({ username: '', fullName: '', pin: '', password: '', role: 'CASHIER' });
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setDeletingUser(null);
    resetForm();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'CASHIER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600 mt-1">Administra usuarios y permisos</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          Crear Usuario
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay usuarios</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(user)} 
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuario"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={user.id === currentUser?.id}
                        className={`${user.id === currentUser?.id ? 'text-gray-300 cursor-not-allowed' : user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        disabled={user.id === currentUser?.id}
                        className={`${user.id === currentUser?.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                        title="Eliminar usuario permanentemente"
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

      {/* MODAL: Crear Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Usuario</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 dígitos numéricos) *</label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder="Ejemplo: 1234"
                />
                <p className="text-xs text-gray-500 mt-1">4 dígitos para acceso rápido en POS</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (6+ caracteres, opcional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Opcional: para login web completo</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'CASHIER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CASHIER">Cajero</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Usuario: {editingUser.username}</h2>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo PIN (4 dígitos numéricos)</label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder="Dejar vacío para mantener el actual"
                />
                <p className="text-xs text-gray-500 mt-1">Dejar vacío para mantener el actual</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (6+ caracteres)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                  placeholder="Dejar vacío para mantener la actual"
                />
                <p className="text-xs text-gray-500 mt-1">Dejar vacío para mantener la actual</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'CASHIER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CASHIER">Cajero</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
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

      {/* MODAL: Confirmar Eliminación de Usuario */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-900">⚠️ Confirmar Eliminación</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas <strong className="text-red-600">eliminar permanentemente</strong> al usuario <strong>"{deletingUser.username}"</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Advertencia importante:</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Esta acción NO se puede deshacer</li>
                  <li>Si el usuario tiene ventas, sesiones u otros registros, NO podrá eliminarse</li>
                  <li>En ese caso, considera <strong>desactivarlo</strong> en lugar de eliminarlo</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Si solo quieres evitar que inicie sesión, usa el botón <strong>"Desactivar"</strong> en lugar de eliminar.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
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
