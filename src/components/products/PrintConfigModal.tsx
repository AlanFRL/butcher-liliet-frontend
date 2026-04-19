import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../ui';
import type { Product, ProductCategory } from '../../types';

interface PrintConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: ProductCategory[];
  onPrint: (selectedProducts: Product[]) => void;
  title: string;
  description: string;
  storageKey: string;
}

export const PrintConfigModal: React.FC<PrintConfigModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onPrint,
  title,
  description,
  storageKey
}) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (isOpen) {
      // Try to load from localStorage
      const savedSelection = localStorage.getItem(storageKey);
      if (savedSelection) {
        try {
          const parsed = JSON.parse(savedSelection);
          setSelectedCategories(new Set(parsed.categories));
          setSelectedProducts(new Set(parsed.products));
          return;
        } catch (e) {
          console.error("Error parsing saved print selection", e);
        }
      }

      // By default select all categories
      const allCategoryIds = new Set(categories.map(c => c.id));
      // And products without category (we can use 'null' or 'none' as key, let's keep it simple and just rely on category ids)
      allCategoryIds.add('none');
      setSelectedCategories(allCategoryIds);
      
      const allProductIds = new Set(products.map(p => p.id));
      setSelectedProducts(allProductIds);
    }
  }, [isOpen, categories, products, storageKey]);

  // Guardar selección cada vez que cambie
  useEffect(() => {
    // No guardamos si el modal no está abierto porque se ejecutaría en el montaje inicial vacío
    if (isOpen) {
      const dataToSave = {
        categories: Array.from(selectedCategories),
        products: Array.from(selectedProducts)
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [selectedCategories, selectedProducts, isOpen, storageKey]);

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    const categoryProducts = products.filter(p => (p.categoryId || 'none') === categoryId);
    
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
      // Remove products of this category
      const newSelectedProducts = new Set(selectedProducts);
      categoryProducts.forEach(p => newSelectedProducts.delete(p.id));
      setSelectedProducts(newSelectedProducts);
    } else {
      newSelected.add(categoryId);
      // Add products of this category
      const newSelectedProducts = new Set(selectedProducts);
      categoryProducts.forEach(p => newSelectedProducts.add(p.id));
      setSelectedProducts(newSelectedProducts);
    }
    setSelectedCategories(newSelected);
  };

  const toggleProduct = (productId: string, categoryId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);

    // If all products in category are unselected, unselect category
    const categoryProducts = products.filter(p => (p.categoryId || 'none') === categoryId);
    const anySelected = categoryProducts.some(p => newSelected.has(p.id));
    
    const newSelectedCats = new Set(selectedCategories);
    if (!anySelected) {
      newSelectedCats.delete(categoryId);
    } else {
      newSelectedCats.add(categoryId);
    }
    setSelectedCategories(newSelectedCats);
  };

  const handlePrint = () => {
    const filteredProducts = products.filter(p => selectedProducts.has(p.id));
    onPrint(filteredProducts);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        <p className="text-gray-600 mb-4">
          {description}
        </p>

        {/* List of categories and their products */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryProducts = products.filter(p => p.categoryId === category.id);
            if (categoryProducts.length === 0) return null;
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3 border-b border-gray-200 pb-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="w-5 h-5 text-primary-600 rounded"
                    id={`cat-${category.id}`}
                  />
                  <label htmlFor={`cat-${category.id}`} className="font-bold text-gray-800 text-lg cursor-pointer">
                    {category.name} ({categoryProducts.length})
                  </label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProduct(product.id, category.id)}
                        className="w-4 h-4 text-primary-500 rounded"
                        id={`prod-${product.id}`}
                      />
                      <label htmlFor={`prod-${product.id}`} className="text-gray-700 cursor-pointer">
                        {product.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 p-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handlePrint} disabled={selectedProducts.size === 0}>
          Continuar e Imprimir
        </Button>
      </div>
    </Modal>
  );
};
