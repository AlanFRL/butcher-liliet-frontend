import React from 'react';
import type { Product } from '../types';

interface PrintablePLUListProps {
  products: Product[];
  printDate: string;
}

/**
 * Componente para imprimir lista de productos PLU de balanza
 * Formato compacto para ~100 productos en hoja carta
 */
export const PrintablePLUList: React.FC<PrintablePLUListProps> = ({ products, printDate }) => {
  // Filtrar solo productos con código de balanza (WEIGHT_EMBEDDED)
  // y ordenar por código (PLU)
  const pluProducts = products
    .filter(p => p.barcodeType === 'WEIGHT_EMBEDDED' && p.barcode)
    .sort((a, b) => {
      const codeA = parseInt(a.barcode || '0');
      const codeB = parseInt(b.barcode || '0');
      return codeA - codeB;
    });

  // Extraer número PLU del código de 6 dígitos
  // Ej: 200001 → PLU 1, 200002 → PLU 2
  const getPLUNumber = (barcode: string) => {
    return parseInt(barcode.slice(-5)); // Últimos 5 dígitos
  };

  // Dividir productos en dos columnas
  const midPoint = Math.ceil(pluProducts.length / 2);
  const leftColumn = pluProducts.slice(0, midPoint);
  const rightColumn = pluProducts.slice(midPoint);

  // Componente de tabla reutilizable
  const ProductTable = ({ products, startIndex }: { products: Product[], startIndex: number }) => (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      border: '2px solid #003366'
    }}>
      <thead>
        <tr style={{
          backgroundColor: '#e0e0e0',
          borderBottom: '2px solid #003366'
        }}>
          <th style={{
            border: '1px solid #003366',
            padding: '3px 6px',
            textAlign: 'center',
            fontWeight: 'bold',
            width: '50px',
            fontSize: '9pt',
            color: '#003366'
          }}>
            PLU
          </th>
          <th style={{
            border: '1px solid #003366',
            padding: '3px 6px',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '9pt',
            color: '#003366'
          }}>
            PRODUCTO
          </th>
          <th style={{
            border: '1px solid #003366',
            padding: '3px 6px',
            textAlign: 'right',
            fontWeight: 'bold',
            width: '70px',
            fontSize: '9pt',
            color: '#003366'
          }}>
            Bs/KG
          </th>
          <th style={{
            border: '1px solid #003366',
            padding: '3px 6px',
            textAlign: 'right',
            fontWeight: 'bold',
            width: '70px',
            fontSize: '9pt',
            color: '#003366'
          }}>
            PRECIO DESC.
          </th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={product.id} style={{
            backgroundColor: (startIndex + index) % 2 === 0 ? '#fff' : '#f9f9f9'
          }}>
            <td style={{
              border: '1px solid #003366',
              padding: '2px 6px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '10pt',
              color: '#003366'
            }}>
              {getPLUNumber(product.barcode || '')}
            </td>
            <td style={{
              border: '1px solid #003366',
              padding: '2px 6px',
              textAlign: 'left',
              fontSize: '9pt',
              color: '#003366'
            }}>
              {product.name}
            </td>
            <td style={{
              border: '1px solid #003366',
              padding: '2px 6px',
              textAlign: 'right',
              fontWeight: 'bold',
              fontSize: '10pt',
              color: '#003366'
            }}>
              {product.price.toFixed(2)}
            </td>
            <td style={{
              border: '1px solid #003366',
              padding: '2px 6px',
              textAlign: 'right',
              fontWeight: 'bold',
              fontSize: '10pt',
              color: product.discountActive && product.discountPrice ? '#006600' : '#999'
            }}>
              {product.discountActive && product.discountPrice 
                ? product.discountPrice.toFixed(2) 
                : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{
      width: '100%',
      maxWidth: '8.5in',
      margin: '0 auto',
      padding: '0.3in',
      fontFamily: 'Arial, sans-serif',
      fontSize: '10pt',
      color: '#003366',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '10px',
        borderBottom: '2px solid #003366',
        paddingBottom: '6px'
      }}>
        <h1 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 4px 0',
          color: '#003366'
        }}>
          LISTA DE PRODUCTOS - BALANZA
        </h1>
        <p style={{
          fontSize: '9pt',
          margin: '0',
          color: '#003366'
        }}>
          Fecha de impresión: {printDate} | Total: {pluProducts.length} productos
        </p>
      </div>

      {/* Tablas en dos columnas */}
      {pluProducts.length > 0 ? (
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between'
        }}>
          {/* Columna izquierda */}
          <div style={{ width: '49%' }}>
            <ProductTable products={leftColumn} startIndex={0} />
          </div>

          {/* Columna derecha */}
          <div style={{ width: '49%' }}>
            <ProductTable products={rightColumn} startIndex={midPoint} />
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#003366',
          fontSize: '12pt'
        }}>
          No hay productos con código de balanza registrados
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
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
