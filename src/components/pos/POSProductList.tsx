import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Plus, Star } from 'lucide-react';
import { Button } from '../ui';
import type { Product, CartItem } from '../../types';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface POSProductListProps {
  products: Product[];
  categories: Category[];
  favoriteProducts: Product[];
  cartItems: CartItem[];
  searchTerm: string;
  selectedCategory: string | null;
  orderId?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
}

export const POSProductList: React.FC<POSProductListProps> = ({
  products,
  categories,
  favoriteProducts,
  cartItems,
  searchTerm,
  selectedCategory,
  orderId,
  onSearchChange,
  onCategoryChange,
  onAddToCart,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Indicador si viene de pedido */}
      {orderId && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-blue-800">
              <Package className="w-5 h-5 mr-2" />
              <span className="font-medium">Cobrando pedido - Items pre-cargados</span>
            </div>
            <Button
              onClick={() => navigate('/orders')}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      {/* Barra de búsqueda */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar producto por nombre o código..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        </div>
      </div>
      
      {/* Categorías */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
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
      
      {/* Productos Favoritos */}
      {!searchTerm && !selectedCategory && favoriteProducts.length > 0 && (
        <div className="bg-white p-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
            <Star className="w-4 h-4 mr-1 text-accent-500 fill-current" />
            Favoritos
          </h3>
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2" style={{ maxHeight: '200px', flexWrap: 'wrap' }}>
              {favoriteProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  className="bg-accent-50 border-2 border-accent-300 rounded-lg p-3 hover:bg-accent-100 transition-all text-left flex-shrink-0"
                  style={{ minWidth: '160px', maxWidth: '200px' }}
                >
                  <p className="font-bold text-gray-900 text-sm mb-1 truncate">
                    {product.name}
                  </p>
                  <p className="text-accent-700 font-semibold">
                    Bs {Math.round(product.price)}/{product.unit}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            // Calcular stock disponible para productos por unidad
            const currentInCart = cartItems.find(item => item.productId === product.id)?.qty || 0;
            const availableStock = product.saleType === 'UNIT' && product.stockUnits !== undefined
              ? product.stockUnits - currentInCart
              : null;
            const isOutOfStock = availableStock !== null && availableStock <= 0;
            
            return (
            <div
              key={product.id}
              className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all relative group ${isOutOfStock ? 'opacity-60' : ''}`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product.id);
                }}
                className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-accent-50 transition-colors"
                title={product.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Star className={`w-4 h-4 ${product.isFavorite ? 'text-accent-500 fill-current' : 'text-gray-300'}`} />
              </button>
              
              {/* Indicador de stock */}
              {availableStock !== null && (
                <div className="absolute top-2 left-2 z-10">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    availableStock <= 0 ? 'bg-red-100 text-red-700' :
                    availableStock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {availableStock <= 0 ? 'Sin stock' : `Stock: ${availableStock}`}
                  </span>
                </div>
              )}
              
              <button
                onClick={() => onAddToCart(product)}
                className="w-full text-left"
                disabled={isOutOfStock}
              >
              <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 pr-8 mt-6">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary-700">
                    Bs {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">por {product.unit}</p>
                </div>
                {!isOutOfStock && (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              </button>
            </div>
            );
          })}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
};
