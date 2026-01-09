import React, { useState } from 'react';
import { Package, Plus, Edit2, Star, Search } from 'lucide-react';
import { Button, Modal, Input } from '../components/ui';
import { useProductStore, useAuthStore } from '../store';
import type { Product, SaleType } from '../types';

export const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { products, categories, addProduct, updateProduct, toggleProductActive, toggleProductFavorite } = useProductStore();
  const { currentUser } = useAuthStore();
  
  // Verificar si el usuario puede editar
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    saleType: 'WEIGHT' as SaleType,
    unit: 'kg',
    price: '',
  });
  
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId || '',
        saleType: product.saleType,
        unit: product.unit,
        price: product.price.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        saleType: 'WEIGHT',
        unit: 'kg',
        price: '',
      });
    }
    setShowModal(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      alert('El precio debe ser un número válido');
      return;
    }
    
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        categoryId: formData.categoryId || null,
        saleType: formData.saleType,
        unit: formData.unit,
        price,
      });
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        categoryId: formData.categoryId || null,
        saleType: formData.saleType,
        unit: formData.unit,
        price,
        taxRate: 0,
        isActive: true,
      });
    }
    
    setShowModal(false);
  };
  
  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchTerm) {
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Productos</h1>
          <p className="text-gray-600">
            {canEdit ? 'Gestiona tu catálogo de productos' : 'Explora y marca tus productos favoritos'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()} variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          {/* Categorías */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Lista de Productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Precio
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const category = categories.find((c) => c.id === product.categoryId);
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.isFavorite && (
                        <Star className="w-4 h-4 text-accent-500 fill-current mr-2" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.saleType === 'WEIGHT' ? 'Peso' : 'Unidad'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-gray-900">
                      Bs {product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">por {product.unit}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {canEdit ? (
                      <button
                        onClick={() => toggleProductActive(product.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleProductFavorite(product.id)}
                        className={`p-2 rounded-lg transition-all ${
                          product.isFavorite
                            ? 'text-accent-500 hover:bg-accent-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={product.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        <Star className={`w-4 h-4 ${product.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>
      
      {/* Modal de Producto */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre del Producto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <Input
              label="Código SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Venta
              </label>
              <select
                value={formData.saleType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    saleType: e.target.value as SaleType,
                    unit: e.target.value === 'WEIGHT' ? 'kg' : 'unidad',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="WEIGHT">Por Peso</option>
                <option value="UNIT">Por Unidad</option>
              </select>
            </div>
            
            <Input
              label="Unidad"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="kg, g, unidad, etc."
              required
            />
          </div>
          
          <Input
            label="Precio"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="lg" className="flex-1">
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
