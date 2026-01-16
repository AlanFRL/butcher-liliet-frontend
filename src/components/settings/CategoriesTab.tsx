import React, { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Trash2, Tag, Package } from 'lucide-react';
import { categoriesApi } from '../../services/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  productCount?: number; // Para validación de eliminación
  createdAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
}

export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll(true); // Incluir inactivas
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);
      await categoriesApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadCategories();
    } catch (error: any) {
      alert(error.message || 'Error al crear categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);
      await categoriesApi.update(editingCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setEditingCategory(null);
      resetForm();
      await loadCategories();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    const action = category.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} categoría "${category.name}"?`)) return;

    try {
      setLoading(true);
      await categoriesApi.update(category.id, {
        isActive: !category.isActive,
      });
      await loadCategories();
    } catch (error: any) {
      alert(error.message || 'Error al cambiar estado de categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    // Validación: verificar si tiene productos asociados
    if (deletingCategory.productCount && deletingCategory.productCount > 0) {
      alert(
        `No se puede eliminar la categoría "${deletingCategory.name}" porque tiene ${deletingCategory.productCount} producto(s) asociado(s).\n\n` +
        'Para poder eliminarla, primero debes:\n' +
        '• Reasignar los productos a otra categoría, o\n' +
        '• Eliminar los productos asociados\n\n' +
        'Alternativamente, puedes desactivar la categoría para ocultarla sin eliminarla.'
      );
      setDeletingCategory(null);
      return;
    }

    try {
      setLoading(true);
      await categoriesApi.delete(deletingCategory.id);
      setDeletingCategory(null);
      await loadCategories();
      alert('Categoría eliminada correctamente');
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      if (error.message.includes('producto')) {
        alert(
          'No se puede eliminar esta categoría porque tiene productos asociados.\n\n' +
          'En su lugar, puedes desactivarla para ocultarla del sistema.'
        );
      } else {
        alert(error.message || 'Error al eliminar categoría');
      }
      setDeletingCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Categorías</h2>
          <p className="text-gray-600 mt-1">Administra las categorías de productos</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Crear Categoría
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && categories.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay categorías</td></tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.description || <span className="text-gray-400 italic">Sin descripción</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>{category.productCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(category)} 
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar categoría"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(category)}
                        className={`${category.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        title={category.isActive ? 'Desactivar categoría' : 'Activar categoría'}
                      >
                        {category.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => setDeletingCategory(category)} 
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar categoría permanentemente"
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

      {/* MODAL: Crear Categoría */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Categoría</h2>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Carnes Rojas, Embutidos, Aves"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Breve descripción de la categoría..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Creando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Categoría */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Categoría: {editingCategory.name}</h2>
            </div>
            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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

      {/* MODAL: Confirmar Eliminación de Categoría */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-900">⚠️ Confirmar Eliminación</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas <strong className="text-red-600">eliminar permanentemente</strong> la categoría <strong>"{deletingCategory.name}"</strong>?
              </p>
              
              {deletingCategory.productCount && deletingCategory.productCount > 0 && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4 my-4">
                  <p className="text-sm text-red-800 font-semibold mb-2">🚫 No se puede eliminar</p>
                  <p className="text-sm text-red-700">
                    Esta categoría tiene <strong>{deletingCategory.productCount} producto(s)</strong> asociado(s). Debes reasignar o eliminar esos productos primero.
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Advertencia importante:</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Esta acción NO se puede deshacer</li>
                  <li>Solo se puede eliminar si NO tiene productos asociados</li>
                  <li>En caso de tener productos, considera <strong>desactivarla</strong> en lugar de eliminarla</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Si solo quieres ocultarla, usa el botón <strong>"Desactivar"</strong> en lugar de eliminar.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={loading || (!!deletingCategory.productCount && deletingCategory.productCount > 0)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
