import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Star, Search, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Modal, Input, useToast } from '../components/ui';
import { useProductStore, useAuthStore } from '../store';
import type { Product, SaleType } from '../types';

export const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const { showToast, ToastComponent } = useToast();
  
  const { products, categories, addProduct, updateProduct, toggleProductFavorite, loadProducts, loadCategories, isLoading } = useProductStore();
  const { currentUser } = useAuthStore();
  
  // Cargar productos y categorías si están vacíos
  useEffect(() => {
    if (products.length === 0 && !isLoading) {
      loadCategories();
      loadProducts();
    }
  }, []);
  
  // Verificar si el usuario puede editar
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    barcodeType: 'STANDARD' as 'STANDARD' | 'WEIGHT_EMBEDDED' | 'NONE',
    categoryId: '',
    saleType: 'WEIGHT' as SaleType,
    inventoryType: 'WEIGHT' as 'UNIT' | 'WEIGHT' | 'VACUUM_PACKED',
    price: '',
    stockQuantity: '',
    minStock: '',
  });
  
  const handleOpenModal = (product?: Product) => {
    setFieldErrors({});
    if (product) {
      setEditingProduct(product);
      const invType = (product.inventoryType as any) || (product.saleType === 'WEIGHT' ? 'WEIGHT' : 'UNIT');
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        barcodeType: (product.barcodeType as any) || 'STANDARD',
        categoryId: product.categoryId || '',
        saleType: product.saleType,
        inventoryType: invType,
        price: product.price.toString(),
        stockQuantity: product.stockUnits?.toString() || '',
        minStock: product.minStockAlert?.toString() || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        barcodeType: 'STANDARD',
        categoryId: '',
        saleType: 'WEIGHT',
        inventoryType: 'WEIGHT',
        price: '',
        stockQuantity: '',
        minStock: '',
      });
    }
    setShowModal(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {[key: string]: string} = {};
    
    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else {
      // Validar nombre único
      const nameExists = products.some(
        p => p.name.toLowerCase() === formData.name.trim().toLowerCase() && 
             (!editingProduct || p.id !== editingProduct.id)
      );
      if (nameExists) {
        errors.name = 'Ya existe un producto con este nombre';
      }
    }
    
    // Validar categoría
    if (!formData.categoryId) {
      errors.categoryId = 'La categoría es obligatoria';
    }
    
    // Validar barcode solo si no es NONE
    if (formData.barcodeType !== 'NONE') {
      if (!formData.barcode || formData.barcode.trim() === '') {
        errors.barcode = 'El código de barras es obligatorio';
      } else {
        // Validar barcode único
        const barcodeExists = products.some(
          p => p.barcode === formData.barcode.trim() && 
               (!editingProduct || p.id !== editingProduct.id)
        );
        if (barcodeExists) {
          errors.barcode = 'Este código de barras ya está en uso';
        }
        
        // Validar formato de barcode según tipo
        if (formData.barcodeType === 'WEIGHT_EMBEDDED') {
          if (!/^\d{6}$/.test(formData.barcode)) {
            errors.barcode = 'Para productos pesados, el código debe ser de 6 dígitos';
          }
        } else if (formData.barcodeType === 'STANDARD') {
          if (!/^\d{8,14}$/.test(formData.barcode)) {
            errors.barcode = 'El código estándar debe tener entre 8 y 14 dígitos';
          }
        }
      }
    }
    
    // Validar precio (no requerido para productos al vacío)
    const price = formData.inventoryType === 'VACUUM_PACKED' ? 0 : parseFloat(formData.price);
    if (formData.inventoryType !== 'VACUUM_PACKED') {
      if (!formData.price || isNaN(price) || price <= 0) {
        errors.price = 'El precio debe ser mayor a 0';
      }
    }
    
    // Validar stock solo para productos que NO son por peso y NO son al vacío
    if (formData.inventoryType === 'UNIT') {
      if (formData.stockQuantity && parseFloat(formData.stockQuantity) < 0) {
        errors.stockQuantity = 'El stock no puede ser negativo';
      }
      if (formData.minStock && parseFloat(formData.minStock) < 0) {
        errors.minStock = 'El stock mínimo no puede ser negativo';
      }
    }
    
    // Mostrar errores si los hay
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast('error', firstError);
      return;
    }
    
    setFieldErrors({});
    
    if (formData.inventoryType !== 'VACUUM_PACKED' && (isNaN(price) || price < 0)) {
      showToast('warning', 'El precio debe ser un número válido');
      return;
    }
    
    // Stock solo aplica para productos normales, no al vacío
    const stockQuantity = formData.inventoryType !== 'VACUUM_PACKED' && formData.stockQuantity ? parseFloat(formData.stockQuantity) : undefined;
    const minStock = formData.inventoryType !== 'VACUUM_PACKED' && formData.minStock ? parseFloat(formData.minStock) : undefined;
    
    // Determinar unidad automáticamente
    const unit = formData.saleType === 'WEIGHT' ? 'kg' : (formData.inventoryType === 'VACUUM_PACKED' ? 'paquete' : 'unidad');
    
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          barcode: formData.barcodeType === 'NONE' ? undefined : formData.barcode,
          barcodeType: formData.barcodeType,
          categoryId: formData.categoryId || null,
          saleType: formData.saleType,
          inventoryType: formData.inventoryType,
          unit,
          price,
          stockUnits: stockQuantity,
          minStockAlert: minStock,
        });
      } else {
        await addProduct({
          name: formData.name,
          barcode: formData.barcodeType === 'NONE' ? undefined : formData.barcode,
          barcodeType: formData.barcodeType,
          categoryId: formData.categoryId || null,
          saleType: formData.saleType,
          inventoryType: formData.inventoryType,
          unit,
          price,
          taxRate: 0,
          isActive: true,
          stockUnits: stockQuantity,
          minStockAlert: minStock,
        } as any);
      }
      
      showToast('success', editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Intentar extraer mensaje específico del error
      let errorMessage = 'Error al guardar el producto';
      const errorText = error?.message || '';
      
      if (errorText.includes('Barcode') && errorText.includes('already exists')) {
        setFieldErrors({ barcode: 'Este código de barras ya está en uso' });
        errorMessage = 'El código de barras ya está registrado en otro producto';
      } else if (errorText.includes('name') && errorText.includes('already exists')) {
        setFieldErrors({ name: 'Ya existe un producto con este nombre' });
        errorMessage = 'El nombre del producto ya está en uso';
      }
      
      showToast('error', errorMessage);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });

      if (response.ok) {
        showToast('success', 'Producto eliminado exitosamente');
        await loadProducts();
      } else {
        const error = await response.json();
        showToast('error', error.message || 'No se puede eliminar el producto porque está en uso.');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('error', 'Error al eliminar el producto');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        },
        body: JSON.stringify({
          isActive: !product.isActive
        })
      });

      if (response.ok) {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
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
      {ToastComponent}
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
                Código de Barras
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
                    {product.barcode || 'Sin código'}
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
                        onClick={() => handleToggleActive(product)}
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 mx-auto ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Activo
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inactivo
                          </>
                        )}
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
                        <>
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre del Producto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={fieldErrors.name}
              required
            />
            
            {/* Mostrar SKU read-only al editar */}
            {editingProduct && (
              <Input
                label="C\u00f3digo SKU (auto-generado)"
                value={editingProduct.sku}
                disabled
                className="bg-gray-50"
              />
            )}
            
            {/* Barcode Type */}
            {!editingProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Cómo se identifica? *
                </label>
                <select
                  value={formData.barcodeType}
                  onChange={(e) => setFormData({ ...formData, barcodeType: e.target.value as any, barcode: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="STANDARD">Código del proveedor (productos empacados)</option>
                  <option value="WEIGHT_EMBEDDED">Código de balanza (carnes pesadas)</option>
                  <option value="NONE">Sin código de barras</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Barcode Input - Solo mostrar si NO es NONE */}
          {formData.barcodeType !== 'NONE' && (
            <div>
              <Input
                label={`C\u00f3digo de Barras * ${formData.barcodeType === 'WEIGHT_EMBEDDED' ? '(6 d\u00edgitos)' : formData.barcodeType === 'STANDARD' ? '(8-14 d\u00edgitos)' : ''}`}
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}                error={fieldErrors.barcode}                placeholder={formData.barcodeType === 'WEIGHT_EMBEDDED' ? '200001' : formData.barcodeType === 'STANDARD' ? '7501234567890' : ''}
                required
                maxLength={formData.barcodeType === 'WEIGHT_EMBEDDED' ? 6 : formData.barcodeType === 'STANDARD' ? 14 : 100}
              />
              {formData.barcodeType === 'WEIGHT_EMBEDDED' && (
                <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded border border-blue-200">
                  💡 <strong>Tip:</strong> Ingresa solo los 6 dígitos del medio que identifican el producto. Ejemplo: si la balanza imprime <code className="bg-white px-1">2000010123456</code>, ingresa <code className="bg-white px-1 font-bold">200001</code>
                </p>
              )}
            </div>
          )}
          
          {/* Mensaje cuando no tiene código */}
          {formData.barcodeType === 'NONE' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                ℹ️ Este producto no tiene código de barras. Podrás buscarlo por nombre o categoría en el punto de venta.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={`w-full px-4 py-2 border ${fieldErrors.categoryId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Venta
              </label>
              <select
                value={formData.saleType}
                onChange={(e) => {
                  const saleType = e.target.value as SaleType;
                  setFormData({
                    ...formData,
                    saleType,
                    inventoryType: saleType === 'WEIGHT' ? 'WEIGHT' : 'UNIT',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="WEIGHT">Por Peso (kg)</option>
                <option value="UNIT">Por Unidad</option>
              </select>
            </div>
          </div>

          {/* Tipo de Inventario - Solo para productos por unidad */}
          {formData.saleType === 'UNIT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Inventario
              </label>
              <select
                value={formData.inventoryType}
                onChange={(e) => setFormData({ ...formData, inventoryType: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="UNIT">Producto Normal</option>
                <option value="VACUUM_PACKED">Producto al Vacío (paquetes artesanales)</option>
              </select>
            </div>
          )}

          {/* Precio y Stock - Solo para productos normales */}
          {formData.inventoryType !== 'VACUUM_PACKED' && (
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Precio (Bs)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={fieldErrors.price}
                required
              />
              
              {/* Stock solo para productos por unidad (no por peso ni al vacío) */}
              {formData.inventoryType === 'UNIT' && (
                <>
                  <Input
                    label="Stock Actual"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    error={fieldErrors.stockQuantity}
                    placeholder="0"
                  />
                  <Input
                    label="Stock Mínimo"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    error={fieldErrors.minStock}
                    placeholder="0"
                  />
                </>
              )}
              
              {/* Nota para productos por peso */}
              {formData.inventoryType === 'WEIGHT' && (
                <div className="bg-gray-50 px-3 py-2 rounded-lg">
                  <p className="text-xs text-gray-600">
                    ℹ️ Los productos por peso no requieren control de inventario
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Nota para productos al vacío */}
          {formData.inventoryType === 'VACUUM_PACKED' && (
            <div className="bg-blue-50 px-3 py-2 rounded-lg">
              <p className="text-xs text-blue-800">
                Los paquetes se agregan individualmente en Inventario → Lotes
              </p>
            </div>
          )}
          
          <div className="flex space-x-3 pt-2">
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
              {editingProduct ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
