import React from 'react';

interface ThermalReceiptProps {
  data: {
    business: string;
    address: string;
    phone: string;
    date: string;
    cashier: string;
    openedBy?: string;
    closedBy?: string;
    cashRegister: string;
    openTime: string;
    closeTime: string;
    initialAmount: number;
    sales: Array<{
      id: string;
      time: string;
      total: number;
      items: Array<{
        name: string;
        quantity: number;
        unit: string;
        price: number;
        subtotal: number;
      }>;
      paymentMethod: string;
    }>;
    totalSales: number;
    totalCashSales: number;
    totalTransferSales: number;
    totalCash: number;
    finalAmount: number;
    difference: number;
  };
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ data }) => {
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
          
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          
          .thermal-receipt {
            position: absolute;
            left: 0 !important;
            top: 0 !important;
            /* Brother QL-800 @ 300 DPI: 62mm = 732px, pero área útil ~700px */
            width: 700px !important;
            max-width: 700px !important;
            min-width: 700px !important;
            margin: 0 !important;
            padding: 24px !important;
            box-sizing: border-box !important;
            transform-origin: top left;
            background: white !important;
          }
          
          .thermal-receipt * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          @page {
            /* 62mm @ 300 DPI = 732px de ancho */
            size: 732px auto;
            margin: 0 !important;
          }
          
          /* Ajustes específicos para Brother QL-800 @ 300 DPI */
          .thermal-receipt {
            font-size: 32px !important;
            line-height: 1.3 !important;
          }
          
          .thermal-receipt .text-base {
            font-size: 38px !important;
          }
          
          .thermal-receipt .text-sm {
            font-size: 34px !important;
          }
          
          .thermal-receipt .text-xs {
            font-size: 28px !important;
          }
          
          .thermal-receipt .font-bold {
            font-weight: bold !important;
          }
          }
          
          .thermal-receipt .mb-4 {
            margin-bottom: 8px !important;
          }
          
          .thermal-receipt .mb-3 {
            margin-bottom: 20px !important;
          }
          
          .thermal-receipt .mb-2 {
            margin-bottom: 14px !important;
          }
          
          .thermal-receipt .mb-4 {
            margin-bottom: 28px !important;
          }
          
          .thermal-receipt .pb-4 {
            padding-bottom: 28px !important;
          }
          
          .thermal-receipt .pb-3 {
            padding-bottom: 20px !important;
          }
          
          .thermal-receipt .pb-2 {
            padding-bottom: 14px !important;
          }
          
          .thermal-receipt .border-b-2 {
            border-bottom-width: 6px !important;
          }
          
          .thermal-receipt .border-t-2 {
            border-top-width: 6px !important;
          }
          
          .thermal-receipt .border-t {
            border-top-width: 3px !important;
          }
        }
      `}</style>
      <div 
        className="thermal-receipt bg-white p-6 mx-auto font-mono text-xs"
        style={{ 
          width: '62mm',
          minHeight: '200mm',
          fontFamily: 'Courier New, monospace',
          maxWidth: '62mm',
          boxSizing: 'border-box',
          padding: '8px'
        }}
      >
      {/* Header */}
      <div className="text-center mb-3 border-b-2 border-dashed border-gray-400 pb-3">
        <div className="text-base font-bold mb-1">{data.business}</div>
        <div className="text-xs">{data.address}</div>
        <div className="text-xs">Tel: {data.phone}</div>
      </div>

      {/* Título del reporte */}
      <div className="text-center mb-4">
        <div className="text-sm font-bold">═══════════════════</div>
        <div className="text-base font-bold my-2">CIERRE DE CAJA</div>
        <div className="text-sm font-bold">═══════════════════</div>
      </div>

      {/* Información del turno */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span className="font-bold">{data.date}</span>
        </div>
        {data.openedBy && (
          <div className="flex justify-between">
            <span>Aperturado por:</span>
            <span className="font-bold">{data.openedBy}</span>
          </div>
        )}
        {data.closedBy && data.closedBy !== data.openedBy && (
          <div className="flex justify-between">
            <span>Cerrado por:</span>
            <span className="font-bold">{data.closedBy}</span>
          </div>
        )}
        {data.closedBy && data.closedBy === data.openedBy && (
          <div className="flex justify-between">
            <span>Cajero:</span>
            <span className="font-bold">{data.cashier}</span>
          </div>
        )}
        {!data.openedBy && (
          <div className="flex justify-between">
            <span>Cajero:</span>
            <span className="font-bold">{data.cashier}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Caja:</span>
          <span className="font-bold">{data.cashRegister}</span>
        </div>
        <div className="flex justify-between">
          <span>Apertura:</span>
          <span>{data.openTime}</span>
        </div>
        <div className="flex justify-between">
          <span>Cierre:</span>
          <span>{data.closeTime}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Monto inicial */}
      <div className="mb-4">
        <div className="flex justify-between font-bold text-sm">
          <span>MONTO INICIAL:</span>
          <span>Bs {data.initialAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Ventas del día */}
      <div className="mb-4">
        <div className="text-center font-bold mb-2">VENTAS DEL TURNO</div>
        
        {data.sales.length === 0 ? (
          <div className="text-center text-gray-500 py-2">No hay ventas registradas</div>
        ) : (
          <>
            {data.sales.map((sale, index) => (
              <div key={sale.id} className="mb-3 pb-2 border-b border-gray-200">
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Venta #{index + 1}</span>
                  <span>{sale.time}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  {sale.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
                </div>
                {sale.items.map((item, idx) => (
                  <div key={idx} className="ml-2 text-xs mb-1">
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                    </div>
                    <div className="flex justify-between ml-2 text-gray-600">
                      <span>{item.quantity.toFixed(3)} {item.unit} × Bs {item.price.toFixed(2)}</span>
                      <span>Bs {item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between mt-1">
                  <span className="ml-2 font-bold">Total:</span>
                  <span className="font-bold">Bs {sale.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
            
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL VENTAS ({data.sales.length}):</span>
              <span>Bs {data.totalSales.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Resumen de caja */}
      <div className="mb-4">
        <div className="text-center font-bold mb-2">RESUMEN DE CAJA</div>
        
        <div className="flex justify-between">
          <span>Monto Inicial:</span>
          <span>Bs {data.initialAmount.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-200 my-1"></div>
        <div className="text-xs font-bold mb-1">VENTAS POR MÉTODO DE PAGO:</div>
        
        <div className="flex justify-between text-xs ml-2">
          <span>Efectivo:</span>
          <span>Bs {data.totalCashSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs ml-2">
          <span>Transferencia:</span>
          <span>Bs {data.totalTransferSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total Ventas:</span>
          <span>Bs {data.totalSales.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <div className="flex justify-between font-bold text-sm">
          <span>EFECTIVO ESPERADO:</span>
          <span>Bs {(data.initialAmount + data.totalCashSales).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm">
          <span>EFECTIVO CONTADO:</span>
          <span>Bs {data.totalCash.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <div className={`flex justify-between font-bold text-base ${
          data.difference === 0 ? 'text-green-600' : 
          data.difference > 0 ? 'text-blue-600' : 'text-red-600'
        }`}>
          <span>DIFERENCIA:</span>
          <span>Bs {data.difference.toFixed(2)}</span>
        </div>
        
        {data.difference !== 0 && (
          <div className="text-center text-xs mt-1 text-gray-600">
            ({data.difference > 0 ? 'Sobrante' : 'Faltante'})
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-6">
        <div>Gracias por su trabajo</div>
        <div className="mt-2">Sistema POS v1.0</div>
        <div className="mt-4">═══════════════════</div>
        <div className="mt-2">FIN DEL REPORTE</div>
      </div>
    </div>
    </>
  );
};
