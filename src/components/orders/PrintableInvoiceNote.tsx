import React from 'react';
import type { Order } from '../../types';
import { amountToWords } from '../../utils/numberToWords';
import logoPrint from '../../assets/logo_print.png';

interface PrintableInvoiceNoteProps {
  order: Order;
}

/**
 * Componente de nota de venta imprimible
 * Usa estilos inline para asegurar compatibilidad con impresión en iframe
 */
export const PrintableInvoiceNote: React.FC<PrintableInvoiceNoteProps> = ({ order }) => {
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div style={{
      maxWidth: '21cm',
      margin: '0 auto',
      padding: '1.5cm',
      backgroundColor: 'white',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#1a1a1a',
      fontSize: '13px'
    }}>
      {/* Encabezado en una sola fila con 3 columnas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr auto',
        gap: '20px',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '3px solid #0f3460'
      }}>
        {/* Logo */}
        <div>
          <img src={logoPrint} alt="Butcher Lilieth" style={{ maxHeight: '80px', maxWidth: '140px' }} />
        </div>
        
        {/* Información del negocio */}
        <div style={{ color: '#0f3460' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 6px 0',
            color: '#0f3460'
          }}>
            Butcher Lilieth
          </h1>
          <p style={{ margin: '3px 0', fontSize: '13px', color: '#0f3460' }}>
            3er Anillo Interno, entre Av. Centenario y C/Urubó, Santa Cruz, Bolivia
          </p>
          <p style={{ margin: '3px 0', fontSize: '13px', color: '#0f3460' }}>
            Cel: 62409387 | 76276838
          </p>
        </div>

        {/* Nota de Venta */}
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #dc2626 0%, #0f3460 100%)',
          borderRadius: '8px',
          minWidth: '200px',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Nota de Venta
          </h2>
          <p style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0
          }}>
            N° {order.orderNumber}
          </p>
        </div>
      </div>

      {/* Información del pedido */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px'
      }}>
        <div>
          <h3 style={{
            fontSize: '12px',
            color: '#dc2626',
            fontWeight: 600,
            margin: '0 0 6px 0',
            textTransform: 'uppercase'
          }}>
            Cliente:
          </h3>
          <p style={{ margin: '3px 0', fontSize: '14px', color: '#1a1a1a' }}>
            <strong>{order.customerName}</strong>
          </p>
          {order.customerPhone && (
            <p style={{ margin: '3px 0', fontSize: '13px', color: '#1a1a1a' }}>
              Tel: {order.customerPhone}
            </p>
          )}
        </div>
        <div>
          <h3 style={{
            fontSize: '12px',
            color: '#dc2626',
            fontWeight: 600,
            margin: '0 0 6px 0',
            textTransform: 'uppercase'
          }}>
            Fecha de Entrega:
          </h3>
          <p style={{ margin: '3px 0', fontSize: '14px', color: '#1a1a1a' }}>
            {formatDate(order.deliveryDate)}
          </p>
        </div>
      </div>

      {/* Tabla de productos */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '20px 0',
        fontSize: '13px'
      }}>
        <thead style={{
          backgroundColor: '#0f3460',
          color: 'white'
        }}>
          <tr>
            <th style={{
              padding: '12px 10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '12px',
              color: 'white',
              textAlign: 'left',
              border: '1px solid #0f3460'
            }}>
              Producto
            </th>
            <th style={{
              padding: '12px 10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '12px',
              color: 'white',
              textAlign: 'center',
              border: '1px solid #0f3460',
              width: '110px'
            }}>
              Cantidad
            </th>
            <th style={{
              padding: '12px 10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '12px',
              color: 'white',
              textAlign: 'right',
              border: '1px solid #0f3460',
              width: '110px'
            }}>
              P. Unit.
            </th>
            <th style={{
              padding: '12px 10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '12px',
              color: 'white',
              textAlign: 'right',
              border: '1px solid #0f3460',
              width: '110px'
            }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => {
            const itemSubtotal = Math.round(item.qty * item.unitPrice);
            const hasItemDiscount = item.discount && item.discount > 0;
            
            return (
              <tr key={index} style={{
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
              }}>
                <td style={{
                  padding: '10px',
                  color: '#1a1a1a',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '14px' }}>
                    {item.productName}
                  </div>
                  {item.productSku && (
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '3px'
                    }}>
                      SKU: {item.productSku}
                    </div>
                  )}
                  {item.notes && (
                    <div style={{
                      fontSize: '11px',
                      color: '#dc2626',
                      fontStyle: 'italic',
                      marginTop: '3px'
                    }}>
                      {item.notes}
                    </div>
                  )}
                </td>
                <td style={{
                  padding: '10px',
                  color: '#1a1a1a',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}>
                  {item.qty} {item.unit}
                </td>
                <td style={{
                  padding: '10px',
                  color: '#1a1a1a',
                  textAlign: 'right',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}>
                  Bs {item.unitPrice.toFixed(2)}
                </td>
                <td style={{
                  padding: '10px',
                  color: '#1a1a1a',
                  textAlign: 'right',
                  fontWeight: 600,
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}>
                  {hasItemDiscount ? (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'line-through', fontWeight: 400 }}>
                        Bs {itemSubtotal.toFixed(2)}
                      </div>
                      <div style={{ color: '#dc2626', fontSize: '11px', fontWeight: 400 }}>
                        -Bs {item.discount!.toFixed(2)}
                      </div>
                      <div style={{ color: '#1a1a1a' }}>
                        Bs {item.total.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div>Bs {item.total.toFixed(2)}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{
        margin: '25px 0 20px auto',
        width: '45%',
        minWidth: '320px'
      }}>
        {order.discount && order.discount > 0 ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 15px',
              fontSize: '14px',
              color: '#1a1a1a',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>Bs {(order.subtotal || order.total + order.discount).toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 15px',
              fontSize: '14px',
              color: '#dc2626',
              fontWeight: 500,
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>Descuento:</span>
              <span>-Bs {order.discount.toFixed(2)}</span>
            </div>
          </>
        ) : null}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 15px',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '5px',
          borderRadius: '6px',
          backgroundColor: '#0f3460',
          color: 'white'
        }}>
          <span>TOTAL:</span>
          <span>Bs {order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Monto en letras */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '15px',
        borderLeft: '4px solid #dc2626',
        margin: '20px 0',
        fontSize: '14px'
      }}>
        <p style={{ color: '#1a1a1a', margin: 0 }}>
          <strong style={{ color: '#0f3460' }}>Son:</strong> {amountToWords(order.total)}
        </p>
      </div>

      {/* Notas adicionales */}
      {order.notes && (
        <div style={{
          margin: '20px 0',
          padding: '12px',
          backgroundColor: '#fef3c7',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '6px'
        }}>
          <h3 style={{
            fontSize: '12px',
            color: '#92400e',
            margin: '0 0 8px 0',
            textTransform: 'uppercase'
          }}>
            Notas:
          </h3>
          <p style={{
            fontSize: '13px',
            margin: 0,
            color: '#78350f'
          }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Pie de página */}
      <div style={{
        textAlign: 'center',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '3px solid #dc2626'
      }}>
        <p style={{
          margin: '5px 0',
          fontSize: '14px',
          color: '#0f3460',
          fontWeight: 600
        }}>
          Gracias por su preferencia
        </p>
        <p style={{
          margin: '5px 0',
          fontSize: '11px',
          color: '#9ca3af',
          fontWeight: 'normal'
        }}>
          Este documento no es válido como factura fiscal
        </p>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 1cm;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
