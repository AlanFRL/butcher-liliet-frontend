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
  // Orden específico de categorías (case-insensitive)
  const categoryOrderMap: Record<string, number> = {
    'CORTES TRADICIONALES': 1,
    'CORTES PARRILLEROS': 2,
    'PARRILLEROS': 2, // Por si acaso existe sin "CORTES"
    'ELABORADOS': 3,
    'POLLO': 4,
    'CERDO': 5,
    'AL VACÍO': 6,
    'AL VACIO': 6, // Alternativa sin acento
  };

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
    const catNameUpper = catName.toUpperCase().trim();
    if (!groupedProducts[catNameUpper]) {
      groupedProducts[catNameUpper] = [];
    }
    groupedProducts[catNameUpper].push(p);
  });
  
  // LOG: Ver categorías encontradas
  console.log('=== PLU WITH DISCOUNT ===');
  console.log('Categorías encontradas:', Object.keys(groupedProducts));

  // Ordenar productos dentro de cada categoría por PLU
  Object.keys(groupedProducts).forEach(cat => {
    groupedProducts[cat].sort((a, b) => parseInt(a.barcode || '0') - parseInt(b.barcode || '0'));
  });

  // Crear lista ordenada de categorías usando el mapa de orden
  const allCategories = Object.keys(groupedProducts).sort((a, b) => {
    const orderA = categoryOrderMap[a] || 999;
    const orderB = categoryOrderMap[b] || 999;
    
    // LOG: Ver orden asignado
    console.log(`Comparando "${a}" (orden: ${orderA}) vs "${b}" (orden: ${orderB})`);
    
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
  
  // LOG: Ver orden final
  console.log('Orden final de categorías:', allCategories);

  // Dividir categorías en 2 columnas
  const midPoint = Math.ceil(allCategories.length / 2);
  const leftCategories = allCategories.slice(0, midPoint);
  const rightCategories = allCategories.slice(midPoint);

  const getPLUNumber = (barcode: string) => parseInt(barcode.slice(-5));

  // Componente de categoría reutilizable
  const CategorySection = ({ category }: { category: string }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '4px 8px',
        fontWeight: 'bold',
        fontSize: '12pt',
        marginBottom: '2px',
        letterSpacing: '0.5px',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}>
        {category}
      </div>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '4px'
      }}>
        <thead>
          <tr style={{
            backgroundColor: '#2a2a2a',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}>
            <th style={{
              border: '2px solid #000',
              padding: '3px 5px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '11pt',
              color: '#fff',
              width: '40px',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>PLU</th>
            <th style={{
              border: '2px solid #000',
              padding: '3px 5px',
              textAlign: 'left',
              fontWeight: 'bold',
              fontSize: '11pt',
              color: '#fff',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>PRODUCTO</th>
            <th style={{
              border: '2px solid #000',
              padding: '3px 5px',
              textAlign: 'right',
              fontWeight: 'bold',
              fontSize: '11pt',
              color: '#fff',
              width: '50px',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>Bs/KG</th>
            <th style={{
              border: '2px solid #000',
              padding: '3px 5px',
              textAlign: 'right',
              fontWeight: 'bold',
              fontSize: '11pt',
              color: '#fff',
              width: '50px',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>DESC</th>
          </tr>
        </thead>
        <tbody>
          {groupedProducts[category].map((product, index) => (
            <tr key={product.id} style={{
              backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5'
            }}>
              <td style={{
                border: '1px solid #000',
                padding: '2px 5px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '12pt',
                color: '#000'
              }}>
                {getPLUNumber(product.barcode || '')}
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '2px 5px',
                textAlign: 'left',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000'
              }}>
                {product.name}
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '2px 5px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '12pt',
                color: '#000'
              }}>
                {Math.round(product.price)}
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '2px 5px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '12pt',
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
  );

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
          color: '#1a1a1a',
          letterSpacing: '0.5px'
        }}>
          LISTA PLU BALANZA - {printDate} - Total: {pluProducts.length} productos
        </div>
      </div>

      {/* Productos en 2 columnas */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'space-between'
      }}>
        {/* Columna izquierda */}
        <div style={{ width: '49%' }}>
          {leftCategories.map(category => (
            <CategorySection key={category} category={category} />
          ))}
        </div>

        {/* Columna derecha */}
        <div style={{ width: '49%' }}>
          {rightCategories.map(category => (
            <CategorySection key={category} category={category} />
          ))}
        </div>
      </div>

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
