import React from 'react';
import type { Product, ProductCategory } from '../types';

interface PrintablePLUListWithDiscountProps {
  products: Product[];
  categories: ProductCategory[];
  printDate: string;
}

/**
 * Lista PLU optimizada con columna de descuentos
 * Agrupada por categorías con orden específico
 */
export const PrintablePLUListWithDiscount: React.FC<PrintablePLUListWithDiscountProps> = ({ products, categories, printDate }) => {
  // Orden específico de categorías
  const categoryOrder = [
    'CORTES TRADICIONALES',
    'PARRILLEROS',
    'ELABORADOS',
    'POLLO',
    'CERDO',
    'AL VACÍO'
  ];

  // Crear diccionario de categorías
  const categoryMap: Record<string, string> = {};
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.name;
  });

  // Filtrar solo productos PLU
  const pluProducts = products.filter(p => p.barcodeType === 'WEIGHT_EMBEDDED' && p.barcode);

  // Agrupar por categoría
  const groupedProducts: Record<string, Product[]> = {};
  pluProducts.forEach(p => {
    const catName = (p.categoryId ? categoryMap[p.categoryId] : 'SIN CATEGORÍA') || 'SIN CATEGORÍA';
    const catNameUpper = catName.toUpperCase();
    if (!groupedProducts[catNameUpper]) {
      groupedProducts[catNameUpper] = [];
    }
    groupedProducts[catNameUpper].push(p);
  });

  // Ordenar productos dentro de cada categoría por PLU
  Object.keys(groupedProducts).forEach(cat => {
    groupedProducts[cat].sort((a, b) => parseInt(a.barcode || '0') - parseInt(b.barcode || '0'));
  });

  // Crear lista ordenada de categorías
  const orderedCategories = categoryOrder.filter(cat => groupedProducts[cat]);
  const otherCategories = Object.keys(groupedProducts)
    .filter(cat => !categoryOrder.includes(cat))
    .sort();
  const allCategories = [...orderedCategories, ...otherCategories];

  const getPLUNumber = (barcode: string) => parseInt(barcode.slice(-5));

  return (
    <div style={{
      width: '100%',
      maxWidth: '8.5in',
      margin: '0',
      padding: '0.2in',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff',
      fontSize: '10pt'
    }}>
      {/* Header compacto en una línea */}
      <div style={{
        textAlign: 'center',
        marginBottom: '8px',
        paddingBottom: '4px'
      }}>
        <div style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          color: '#000',
          letterSpacing: '0.5px'
        }}>
          LISTA PLU BALANZA - {printDate} - Total: {pluProducts.length} productos
        </div>
      </div>

      {/* Productos agrupados por categoría */}
      {allCategories.map(category => (
        <div key={category} style={{ marginBottom: '10px' }}>
          {/* Título de categoría */}
          <div style={{
            backgroundColor: '#1a1a1a',
            color: '#fff',
            padding: '3px 6px',
            fontWeight: 'bold',
            fontSize: '10pt',
            marginBottom: '2px',
            letterSpacing: '0.3px'
          }}>
            {category}
          </div>

          {/* Tabla de productos */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '4px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#e0e0e0' }}>
                <th style={{
                  border: '1px solid #1a1a1a',
                  padding: '2px 4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '9pt',
                  color: '#000',
                  width: '40px'
                }}>PLU</th>
                <th style={{
                  border: '1px solid #1a1a1a',
                  padding: '2px 4px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  fontSize: '9pt',
                  color: '#000'
                }}>PRODUCTO</th>
                <th style={{
                  border: '1px solid #1a1a1a',
                  padding: '2px 4px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '9pt',
                  color: '#000',
                  width: '50px'
                }}>Bs/KG</th>
                <th style={{
                  border: '1px solid #1a1a1a',
                  padding: '2px 4px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '9pt',
                  color: '#000',
                  width: '60px'
                }}>DESC</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts[category].map((product, index) => (
                <tr key={product.id} style={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5'
                }}>
                  <td style={{
                    border: '1px solid #1a1a1a',
                    padding: '1px 4px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '10pt',
                    color: '#000'
                  }}>
                    {getPLUNumber(product.barcode || '')}
                  </td>
                  <td style={{
                    border: '1px solid #1a1a1a',
                    padding: '1px 4px',
                    textAlign: 'left',
                    fontSize: '9pt',
                    color: '#000'
                  }}>
                    {product.name}
                  </td>
                  <td style={{
                    border: '1px solid #1a1a1a',
                    padding: '1px 4px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '10pt',
                    color: '#000'
                  }}>
                    {Math.round(product.price)}
                  </td>
                  <td style={{
                    border: '1px solid #1a1a1a',
                    padding: '1px 4px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '10pt',
                    color: product.discountActive && product.discountPrice ? '#006600' : '#666'
                  }}>
                    {product.discountActive && product.discountPrice 
                      ? Math.round(product.discountPrice)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.25in;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};
