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
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .thermal-receipt-sale, .thermal-receipt-sale * {
            visibility: visible;
          }
          
          .thermal-receipt-sale {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10mm;
            box-sizing: border-box;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        @media screen {
          .thermal-receipt-sale {
            max-width: 80mm;
            margin: 0 auto;
          }
        }
      `}</style>
      
      <div className="thermal-receipt-sale bg-white" style={{ fontFamily: 'monospace', fontSize: '12px', padding: '16px', boxSizing: 'border-box' }}>
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
