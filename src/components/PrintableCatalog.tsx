import React from 'react';
import type { Product, ProductCategory } from '../types';

interface PrintableCatalogProps {
  products: Product[];
  categories: ProductCategory[];
  printDate: string;
}

export const PrintableCatalog: React.FC<PrintableCatalogProps> = ({ products, categories, printDate }) => {
  // Crear diccionario de categorías
  const categoryMap: Record<string, string> = {};
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.name;
  });

  // Agrupar por categoría
  const groupedProducts: Record<string, Product[]> = {};
  products.forEach(p => {
    const catName = (p.categoryId ? categoryMap[p.categoryId] : 'OTROS') || 'OTROS';
    if (!groupedProducts[catName]) {
      groupedProducts[catName] = [];
    }
    groupedProducts[catName].push(p);
  });

  // Ordenar productos dentro de cada categoría por nombre
  Object.keys(groupedProducts).forEach(cat => {
    groupedProducts[cat].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Ordenar categorías alfabéticamente
  const allCategories = Object.keys(groupedProducts).sort((a, b) => a.localeCompare(b));

  const getMonthName = () => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[new Date().getMonth()];
  };

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1f2937', padding: '15px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #b91c1c', paddingBottom: '10px' }}>
        <h1 style={{ fontSize: '20pt', margin: '0 0 5px 0', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '1px' }}>Butcher Lilieth</h1>
        <h2 style={{ fontSize: '14pt', margin: '0 0 2px 0', color: '#374151' }}>Catálogo de Productos y Precios</h2>
        <p style={{ fontSize: '11pt', margin: '0 0 2px 0', color: '#6b7280', fontStyle: 'italic' }}>Precios de {getMonthName()} {currentYear}</p>
        <p style={{ fontSize: '8pt', margin: '0', color: '#9ca3af' }}>Generado: {printDate}</p>
      </div>

      {/* Categories and Products - 2 Columns */}
      <div style={{ columnCount: 2, columnGap: '40px' }}>
        {allCategories.map(category => (
          <div key={category} style={{ marginBottom: '20px' }}>
            <h3 style={{
              backgroundColor: '#b91c1c',
              color: 'white',
              padding: '6px 10px',
              margin: '0 0 8px 0',
              fontSize: '12pt',
              borderRadius: '4px',
              breakAfter: 'avoid',
              pageBreakAfter: 'avoid',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>
              {category}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groupedProducts[category].map(product => {
                const hasDiscount = product.discountActive && product.discountPrice !== undefined && product.discountPrice > 0;
                const finalPrice = hasDiscount ? product.discountPrice! : product.price;

                return (
                  <div key={product.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px dashed #e5e7eb',
                    paddingBottom: '4px',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid'
                  }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>{product.name}</span>
                      <span style={{ fontSize: '9pt', color: '#6b7280', marginLeft: '5px' }}>
                        x {product.saleType === 'WEIGHT' ? 'Kg' : 'Unid'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {hasDiscount ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '9pt' }}>
                            Bs {Math.round(product.price)}
                          </span>
                          <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '12pt' }}>
                            Bs {Math.round(finalPrice)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                          Bs {Math.round(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '2px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '11pt',
        color: '#4b5563'
      }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>📍 Dirección: 3er anillo interno, entre av. centenario y calle urubó, al frente de mueblres Inti.</p>
        <p style={{ margin: '0 0 5px 0' }}>🕒 Horario de atención: 8:00 a 20:00 (Lunes a Domingo)</p>
        <p style={{ margin: '0', fontWeight: 'bold', color: '#b91c1c' }}>📱 Referencias y Pedidos: 76276838</p>
      </div>
    </div>
  );
};
