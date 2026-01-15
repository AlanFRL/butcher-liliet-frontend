import React, { useState, useEffect } from 'react';
import { Palette, Users, Monitor, UserPlus, Edit, UserCheck, UserX, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { applyColorScheme } from '../hooks/useColorScheme';
import { usersApi, terminalsApi } from '../services/api';
import type { UserResponse } from '../types';
import { useAuthStore, useAppStore } from '../store';

type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';
type SettingsTab = 'appearance' | 'users' | 'terminals';

interface Terminal {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

interface UserFormData {
  username: string;
  fullName: string;
  pin: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
}

interface TerminalFormData {
  name: string;
  location: string;
}

const colorSchemes = {
  default: {
    name: 'Rojo Tradicional',
    description: 'Colores clásicos de carnicería',
    primary: { 50: '254 242 242', 100: '254 226 226', 200: '254 202 202', 300: '252 165 165', 400: '248 113 113', 500: '239 68 68', 600: '220 38 38', 700: '185 28 28', 800: '153 27 27', 900: '127 29 29', 950: '69 10 10' },
    accent: { 50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71', 400: '250 204 21', 500: '234 179 8', 600: '202 138 4', 700: '161 98 7', 800: '133 77 14', 900: '113 63 18' }
  },
  blue: {
    name: 'Azul Profesional',
    description: 'Moderno y corporativo',
    primary: { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '30 64 175', 800: '30 58 138', 900: '23 37 84', 950: '15 23 42' },
    accent: { 50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212', 400: '45 212 191', 500: '20 184 166', 600: '13 148 136', 700: '15 118 110', 800: '17 94 89', 900: '19 78 74' }
  },
  green: {
    name: 'Verde Natural',
    description: 'Fresco y orgánico',
    primary: { 50: '240 253 244', 100: '220 252 231', 200: '187 247 208', 300: '134 239 172', 400: '74 222 128', 500: '34 197 94', 600: '22 163 74', 700: '21 128 61', 800: '22 101 52', 900: '20 83 45', 950: '5 46 22' },
    accent: { 50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71', 400: '250 204 21', 500: '234 179 8', 600: '202 138 4', 700: '161 98 7', 800: '133 77 14', 900: '113 63 18' }
  },
  purple: {
    name: 'Púrpura Premium',
    description: 'Elegante y sofisticado',
    primary: { 50: '250 245 255', 100: '243 232 255', 200: '233 213 255', 300: '216 180 254', 400: '192 132 252', 500: '168 85 247', 600: '147 51 234', 700: '126 34 206', 800: '107 33 168', 900: '88 28 135', 950: '59 7 100' },
    accent: { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55' }
  },
  orange: {
    name: 'Naranja Energético',
    description: 'Vibrante y cálido',
    primary: { 50: '255 247 237', 100: '255 237 213', 200: '254 215 170', 300: '253 186 116', 400: '251 146 60', 500: '249 115 22', 600: '234 88 12', 700: '194 65 12', 800: '154 52 18', 900: '124 45 18', 950: '67 20 7' },
    accent: { 50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71', 400: '250 204 21', 500: '234 179 8', 600: '202 138 4', 700: '161 98 7', 800: '133 77 14', 900: '113 63 18' }
  }
};

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { currentTerminal } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>('default');
  
  // Users state
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    fullName: '',
    pin: '',
    password: '',
    role: 'CASHIER',
  });

  // Terminals state
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loadingTerminals, setLoadingTerminals] = useState(false);
  const [isCreateTerminalModalOpen, setIsCreateTerminalModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [deletingTerminal, setDeletingTerminal] = useState<Terminal | null>(null);
  const [terminalFormData, setTerminalFormData] = useState<TerminalFormData>({
    name: '',
    location: '',
  });

  useEffect(() => {
    const savedScheme = (localStorage.getItem('colorScheme') as ColorScheme) || 'default';
    setSelectedScheme(savedScheme);
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && currentUser?.role === 'ADMIN') {
      loadUsers();
    } else if (activeTab === 'terminals' && currentUser?.role === 'ADMIN') {
      loadTerminals();
    }
  }, [activeTab, currentUser]);

  const handleSchemeChange = (scheme: ColorScheme) => {
    setSelectedScheme(scheme);
    applyColorScheme(scheme, colorSchemes[scheme]);
    localStorage.setItem('colorScheme', scheme);
  };

  // ========== USERS FUNCTIONS ==========

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userFormData.pin.length !== 4 || !/^\d{4}$/.test(userFormData.pin)) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }

    try {
      setLoadingUsers(true);
      await usersApi.create({
        username: userFormData.username,
        fullName: userFormData.fullName,
        pin: userFormData.pin,
        password: userFormData.password || undefined,
        role: userFormData.role,
      });
      setIsCreateUserModalOpen(false);
      resetUserForm();
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al crear usuario');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (userFormData.pin && (userFormData.pin.length !== 4 || !/^\d{4}$/.test(userFormData.pin))) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }

    try {
      setLoadingUsers(true);
      const updateData: any = {
        username: userFormData.username,
        fullName: userFormData.fullName,
        role: userFormData.role,
      };

      if (userFormData.pin) updateData.pin = userFormData.pin;
      if (userFormData.password) updateData.password = userFormData.password;

      await usersApi.update(editingUser.id, updateData);
      setEditingUser(null);
      resetUserForm();
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar usuario');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUserActive = async (user: UserResponse) => {
    if (user.id === currentUser?.id) {
      alert('No puedes desactivar tu propio usuario');
      return;
    }

    if (!confirm(user.isActive ? `¿Desactivar usuario "${user.username}"?` : `¿Activar usuario "${user.username}"?`)) return;

    try {
      setLoadingUsers(true);
      if (user.isActive) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.update(user.id, { isActive: true });
      }
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al cambiar estado del usuario');
    } finally {
      setLoadingUsers(false);
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
      setLoadingUsers(true);
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
      setLoadingUsers(false);
    }
  };

  const openEditUserModal = (user: UserResponse) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      fullName: user.fullName,
      pin: '',
      password: '',
      role: user.role,
    });
  };

  const resetUserForm = () => {
    setUserFormData({ username: '', fullName: '', pin: '', password: '', role: 'CASHIER' });
  };

  // ========== TERMINALS FUNCTIONS ==========

  const loadTerminals = async () => {
    try {
      setLoadingTerminals(true);
      const data = await terminalsApi.getAll();
      setTerminals(data);
    } catch (error) {
      console.error('Error al cargar terminales:', error);
    } finally {
      setLoadingTerminals(false);
    }
  };

  const handleCreateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalFormData.name.trim() || !terminalFormData.location.trim()) {
      alert('Nombre y ubicación son requeridos');
      return;
    }

    try {
      setLoadingTerminals(true);
      await terminalsApi.create({
        name: terminalFormData.name.trim(),
        location: terminalFormData.location.trim(),
      });
      setIsCreateTerminalModalOpen(false);
      resetTerminalForm();
      await loadTerminals();
    } catch (error: any) {
      alert(error.message || 'Error al crear terminal');
    } finally {
      setLoadingTerminals(false);
    }
  };

  const handleUpdateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerminal) return;

    if (!terminalFormData.name.trim() || !terminalFormData.location.trim()) {
      alert('Nombre y ubicación son requeridos');
      return;
    }

    try {
      setLoadingTerminals(true);
      await terminalsApi.update(editingTerminal.id, {
        name: terminalFormData.name.trim(),
        location: terminalFormData.location.trim(),
      });
      setEditingTerminal(null);
      resetTerminalForm();
      await loadTerminals();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar terminal');
    } finally {
      setLoadingTerminals(false);
    }
  };

  const handleToggleTerminalActive = async (terminal: Terminal) => {
    const action = terminal.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} terminal "${terminal.name}"?`)) return;

    try {
      setLoadingTerminals(true);
      await terminalsApi.update(terminal.id, { isActive: !terminal.isActive });
      await loadTerminals();
    } catch (error: any) {
      alert(error.message || 'Error al cambiar estado de terminal');
    } finally {
      setLoadingTerminals(false);
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
      setLoadingTerminals(true);
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
      setLoadingTerminals(false);
    }
  };

  const openEditTerminalModal = (terminal: Terminal) => {
    setEditingTerminal(terminal);
    setTerminalFormData({ name: terminal.name, location: terminal.location });
  };

  const resetTerminalForm = () => {
    setTerminalFormData({ name: '', location: '' });
  };

  const closeModals = () => {
    setIsCreateUserModalOpen(false);
    setEditingUser(null);
    setDeletingUser(null);
    setIsCreateTerminalModalOpen(false);
    setEditingTerminal(null);
    setDeletingTerminal(null);
    resetUserForm();
    resetTerminalForm();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'CASHIER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'appearance' as SettingsTab, name: 'Apariencia', icon: Palette, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'users' as SettingsTab, name: 'Usuarios', icon: Users, roles: ['ADMIN'] },
    { id: 'terminals' as SettingsTab, name: 'Terminales', icon: Monitor, roles: ['ADMIN'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(currentUser?.role || ''));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Personaliza la apariencia y administra los recursos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Esquema de Colores</h2>
            <p className="text-gray-600 mb-6">Selecciona el esquema de colores que más te guste</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(colorSchemes).map(([key, scheme]) => (
                <button
                  key={key}
                  onClick={() => handleSchemeChange(key as ColorScheme)}
                  className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                    selectedScheme === key ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                >
                  {selectedScheme === key && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: `rgb(${scheme.primary[600]})` }} />
                    <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: `rgb(${scheme.accent[500]})` }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{scheme.name}</h3>
                  <p className="text-sm text-gray-600">{scheme.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && currentUser?.role === 'ADMIN' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
                <p className="text-gray-600 mt-1">Administra usuarios y permisos</p>
              </div>
              <button onClick={() => setIsCreateUserModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
                  {loadingUsers && users.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay usuarios</td></tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openEditUserModal(user)} 
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar usuario"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleToggleUserActive(user)}
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
          </div>
        )}

        {/* TERMINALS TAB */}
        {activeTab === 'terminals' && currentUser?.role === 'ADMIN' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Gestión de Terminales</h2>
                <p className="text-gray-600 mt-1">Administra las cajas registradoras</p>
              </div>
              <button onClick={() => setIsCreateTerminalModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
                  {loadingTerminals && terminals.length === 0 ? (
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
                            <button onClick={() => openEditTerminalModal(terminal)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5" /></button>
                            <button
                              onClick={() => handleToggleTerminalActive(terminal)}
                              className={`${terminal.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            >
                              {terminal.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setDeletingTerminal(terminal)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Crear Usuario */}
      {isCreateUserModalOpen && (
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
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 dígitos numéricos) *</label>
                <input
                  type="text"
                  value={userFormData.pin}
                  onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value })}
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
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Opcional: para login web completo</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'CASHIER' })}
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
                <button type="submit" disabled={loadingUsers} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loadingUsers ? 'Creando...' : 'Crear Usuario'}
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
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo PIN (4 dígitos numéricos)</label>
                <input
                  type="text"
                  value={userFormData.pin}
                  onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value })}
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
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                  placeholder="Dejar vacío para mantener la actual"
                />
                <p className="text-xs text-gray-500 mt-1">Dejar vacío para mantener la actual</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'CASHIER' })}
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
                <button type="submit" disabled={loadingUsers} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loadingUsers ? 'Actualizando...' : 'Actualizar'}
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
                  disabled={loadingUsers}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingUsers ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear Terminal */}
      {isCreateTerminalModalOpen && (
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
                  value={terminalFormData.name}
                  onChange={(e) => setTerminalFormData({ ...terminalFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Caja 1, Terminal Principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
                <input
                  type="text"
                  value={terminalFormData.location}
                  onChange={(e) => setTerminalFormData({ ...terminalFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Planta baja, Área de ventas"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={loadingTerminals} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loadingTerminals ? 'Creando...' : 'Crear Terminal'}
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
                  value={terminalFormData.name}
                  onChange={(e) => setTerminalFormData({ ...terminalFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
                <input
                  type="text"
                  value={terminalFormData.location}
                  onChange={(e) => setTerminalFormData({ ...terminalFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={loadingTerminals} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loadingTerminals ? 'Actualizando...' : 'Actualizar'}
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
                  disabled={loadingTerminals}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingTerminals ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
