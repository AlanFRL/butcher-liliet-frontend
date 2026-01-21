import React from 'react';

interface ThermalReceiptSaleProps {
  data: {
    saleId: string;
    date: string;
    time: string;
    cashier: string;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
      subtotal: number;
      batchNumber?: string;
      actualWeight?: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashPaid?: number;
    change?: number;
  };
}

export const ThermalReceiptSale: React.FC<ThermalReceiptSaleProps> = ({ data }) => {
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Efectivo';
      case 'TRANSFER': return 'Transferencia';
      case 'CARD': return 'Tarjeta';
      case 'MIXED': return 'Mixto';
      default: return method;
    }
  };

  return (
    <>
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          .thermal-receipt-sale, .thermal-receipt-sale * {
            visibility: visible;
          }
          
          .thermal-receipt-sale {
            position: absolute;
            left: 0 !important;
            top: 0 !important;
            /* Brother QL-800 @ 300 DPI: Ajustado a 480px (~40.6mm) */
            width: 480px !important;
            max-width: 480px !important;
            min-width: 480px !important;
            margin: 0 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
            transform-origin: top left;
            background: white !important;
          }
          
          .thermal-receipt-sale * {
            box-sizing: border-box !important;
          }
          
          @page {
            /* Página de 520px (~44mm) para centrar contenido de 480px */
            size: 520px auto;
            margin: 0 !important;
          }
          
          /* Ajustes de tamaño de fuente para impresión @ 300 DPI */
          .thermal-receipt-sale {
            font-size: 32px !important;
            line-height: 1.3 !important;
          }
          
          .thermal-receipt-sale h1 {
            font-size: 48px !important;
            margin: 0 0 12px 0 !important;
          }
          
          .thermal-receipt-sale .text-xs {
            font-size: 28px !important;
          }
          
          .thermal-receipt-sale .text-lg {
            font-size: 48px !important;
          }
          
          .thermal-receipt-sale .text-base {
            font-size: 38px !important;
          }
          
          .thermal-receipt-sale .font-bold {
            font-weight: bold !important;
          }
          
          .thermal-receipt-sale .font-semibold {
            font-weight: 600 !important;
          }
          
          .thermal-receipt-sale .mb-4 {
            margin-bottom: 28px !important;
          }
          
          .thermal-receipt-sale .mb-3 {
            margin-bottom: 20px !important;
          }
          
          .thermal-receipt-sale .mb-2 {
            margin-bottom: 14px !important;
          }
          
          .thermal-receipt-sale .mb-1 {
            margin-bottom: 8px !important;
          }
          
          .thermal-receipt-sale .pb-3 {
            padding-bottom: 20px !important;
          }
          
          .thermal-receipt-sale .pb-2 {
            padding-bottom: 14px !important;
          }
          
          .thermal-receipt-sale .mt-4 {
            margin-top: 28px !important;
          }
          
          .thermal-receipt-sale .mt-2 {
            margin-top: 14px !important;
          }
          
          .thermal-receipt-sale .border-b-2 {
            border-bottom-width: 6px !important;
          }
          
          .thermal-receipt-sale .border-b {
            border-bottom-width: 3px !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        @media screen {
          .thermal-receipt-sale {
            max-width: 62mm;
            margin: 0 auto;
          }
        }
      `}</style>
      
      <div 
        className="thermal-receipt-sale bg-white" 
        style={{ 
          width: '62mm',
          fontFamily: 'Courier New, monospace', 
          fontSize: '11px', 
          padding: '8px', 
          boxSizing: 'border-box',
          maxWidth: '62mm'
        }}
      >
        {/* Header */}
        <div className="text-center mb-4 pb-3 border-b-2 border-dashed border-gray-400">
          <h1 className="text-lg font-bold mb-1">CARNICERÍA LILIETH</h1>
          <p className="text-xs">Av. Principal #123</p>
          <p className="text-xs">Tel: 71234567</p>
          <p className="text-xs mt-2">{data.date} - {data.time}</p>
        </div>

        {/* Información de venta */}
        <div className="mb-3 pb-2 border-b border-gray-300">
          <div className="flex justify-between text-xs">
            <span>Ticket:</span>
            <span className="font-bold">#{data.saleId.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Atendido por:</span>
            <span className="font-semibold">{data.cashier}</span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-3 pb-2 border-b-2 border-gray-400">
          <div className="text-xs font-bold mb-2">PRODUCTOS</div>
          {data.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{item.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>
                  {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)} {item.unit} x Bs {item.price.toFixed(2)}
                  {item.batchNumber && (
                    <span className="text-gray-600 ml-1">(Lote: {item.batchNumber})</span>
                  )}
                  {item.actualWeight && (
                    <span className="text-gray-600 ml-1">({item.actualWeight.toFixed(3)} kg)</span>
                  )}
                </span>
                <span className="font-bold">Bs {item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="mb-3 pb-2 border-b-2 border-gray-400">
          <div className="flex justify-between text-xs mb-1">
            <span>Subtotal:</span>
            <span>Bs {data.subtotal.toFixed(2)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-xs mb-1 text-red-600">
              <span>Descuento:</span>
              <span>-Bs {data.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-2">
            <span>TOTAL:</span>
            <span>Bs {data.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Información de pago */}
        <div className="mb-3 pb-2 border-b border-gray-300">
          <div className="flex justify-between text-xs mb-1">
            <span>Método de pago:</span>
            <span className="font-semibold">{getPaymentMethodLabel(data.paymentMethod)}</span>
          </div>
          {data.paymentMethod === 'CASH' && data.cashPaid !== undefined && (
            <>
              <div className="flex justify-between text-xs mb-1">
                <span>Pagado:</span>
                <span>Bs {data.cashPaid.toFixed(2)}</span>
              </div>
              {data.change !== undefined && (
                <div className="flex justify-between text-xs font-bold">
                  <span>Cambio:</span>
                  <span>Bs {data.change.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs mt-4">
          <p className="mb-1">¡Gracias por su compra!</p>
          <p className="text-gray-600">Vuelva pronto</p>
        </div>
      </div>
    </>
  );
};
