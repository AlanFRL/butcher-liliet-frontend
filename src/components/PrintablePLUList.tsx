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
      border: '1px solid #000'
    }}>
      <thead>
        <tr style={{
          backgroundColor: '#e0e0e0',
          borderBottom: '2px solid #000'
        }}>
          <th style={{
            border: '1px solid #000',
            padding: '4px 6px',
            textAlign: 'center',
            fontWeight: 'bold',
            width: '50px',
            fontSize: '8pt'
          }}>
            PLU
          </th>
          <th style={{
            border: '1px solid #000',
            padding: '4px 6px',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '8pt'
          }}>
            PRODUCTO
          </th>
          <th style={{
            border: '1px solid #000',
            padding: '4px 6px',
            textAlign: 'right',
            fontWeight: 'bold',
            width: '70px',
            fontSize: '8pt'
          }}>
            Bs/KG
          </th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={product.id} style={{
            backgroundColor: (startIndex + index) % 2 === 0 ? '#fff' : '#f9f9f9'
          }}>
            <td style={{
              border: '1px solid #000',
              padding: '3px 6px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '9pt'
            }}>
              {getPLUNumber(product.barcode || '')}
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '3px 6px',
              textAlign: 'left',
              fontSize: '8pt'
            }}>
              {product.name}
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '3px 6px',
              textAlign: 'right',
              fontWeight: 'bold',
              fontSize: '9pt'
            }}>
              {product.price.toFixed(2)}
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
      padding: '0.4in',
      fontFamily: 'Arial, sans-serif',
      fontSize: '8pt',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        borderBottom: '2px solid #000',
        paddingBottom: '8px'
      }}>
        <h1 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          LISTA DE PRODUCTOS - BALANZA
        </h1>
        <p style={{
          fontSize: '8pt',
          margin: '0',
          color: '#555'
        }}>
          Fecha de impresión: {printDate}
        </p>
        <p style={{
          fontSize: '7pt',
          margin: '3px 0 0 0',
          color: '#666',
          fontStyle: 'italic'
        }}>
          Total de productos: {pluProducts.length}
        </p>
      </div>

      {/* Tablas en dos columnas */}
      {pluProducts.length > 0 ? (
        <div style={{
          display: 'flex',
          gap: '10px',
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
          color: '#999',
          fontSize: '11pt'
        }}>
          No hay productos con código de balanza registrados
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '1px solid #ccc',
        fontSize: '7pt',
        color: '#666',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0' }}>
          Sistema de Gestión - Carnicería Lilieth
        </p>
        <p style={{ margin: '5px 0 0 0' }}>
          Los códigos PLU corresponden a los botones de la balanza
        </p>
      </div>

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
