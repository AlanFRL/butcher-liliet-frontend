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
    terminal: string;
    openTime: string;
    closeTime: string;
    initialAmount: number;
    sales: Array<{
      id: string;
      time: string;
      total: number;
      items: number;
    }>;
    totalSales: number;
    totalCash: number;
    finalAmount: number;
    difference: number;
  };
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ data }) => {
  return (
    <div 
      className="bg-white p-6 mx-auto font-mono text-xs"
      style={{ 
        width: '80mm',
        minHeight: '200mm',
        fontFamily: 'Courier New, monospace'
      }}
    >
      {/* Header */}
      <div className="text-center mb-4 border-b-2 border-dashed border-gray-400 pb-4">
        <div className="text-base font-bold mb-1">{data.business}</div>
        <div className="text-xs">{data.address}</div>
        <div className="text-xs">Tel: {data.phone}</div>
      </div>

      {/* Título del reporte */}
      <div className="text-center mb-4">
        <div className="text-sm font-bold">═══════════════════════════════</div>
        <div className="text-base font-bold my-2">REPORTE DE CIERRE Z</div>
        <div className="text-sm font-bold">═══════════════════════════════</div>
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
          <span>Terminal:</span>
          <span className="font-bold">{data.terminal}</span>
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
              <div key={sale.id} className="mb-2">
                <div className="flex justify-between">
                  <span>Venta #{index + 1}</span>
                  <span>{sale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="ml-2">Items: {sale.items}</span>
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
        <div className="flex justify-between">
          <span>Total Ventas:</span>
          <span>Bs {data.totalSales.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <div className="flex justify-between font-bold">
          <span>ESPERADO EN CAJA:</span>
          <span>Bs {(data.initialAmount + data.totalSales).toFixed(2)}</span>
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
        <div className="mt-4">═══════════════════════════════</div>
        <div className="mt-2">FIN DEL REPORTE</div>
      </div>
    </div>
  );
};
