import React from 'react';
import './ThermalReceiptCashClose.css';

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
    // Resumen de productos vendidos
    productsSummary: Array<{
      productName: string;
      quantity: number;
      unit: string; // 'kg', 'unidad', 'lote'
      total: number;
    }>;
    salesCount: number; // Total de ventas realizadas
    totalSales: number;
    totalCashSales: number;
    totalTransferSales: number;
    totalDeposits?: number;
    totalWithdrawals?: number;
    totalCash: number;
    finalAmount: number;
    difference: number;
  };
  printable?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ data, printable = false }) => {
  return (
    <div 
      className={`thermal-receipt-cash-close bg-white ${printable ? '' : 'no-print'}`}
      data-printable={printable}
    >
      <div className="thermal-receipt-cash-close__inner">
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

      {/* Resumen de Productos Vendidos */}
      <div className="mb-4">
        <div className="text-center font-bold mb-2">PRODUCTOS VENDIDOS</div>
        
        {data.productsSummary.length === 0 ? (
          <div className="text-center text-gray-500 py-2">No hay productos</div>
        ) : (
          <>
            {/* Header de tabla */}
            <div className="flex justify-between text-xs font-bold border-b border-gray-300 pb-1 mb-1">
              <span className="flex-1">Producto</span>
              <span className="w-20 text-right">Cantidad</span>
              <span className="w-16 text-right">Total</span>
            </div>
            
            {/* Filas de productos */}
            {data.productsSummary.map((product, index) => (
              <div key={index} className="flex justify-between text-xs py-0.5 border-b border-gray-100">
                <span className="flex-1 font-medium">{product.productName}</span>
                <span className="w-20 text-right text-gray-600">
                  {product.unit === 'kg' 
                    ? `${product.quantity.toFixed(3)} kg`
                    : product.unit === 'lote'
                    ? `${product.quantity} lotes`
                    : `${product.quantity} unid`}
                </span>
                <span className="w-16 text-right font-semibold">Bs {product.total.toFixed(2)}</span>
              </div>
            ))}
            
            <div className="border-t border-dashed border-gray-400 mt-2 pt-2">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL ({data.salesCount} ventas):</span>
                <span>Bs {data.totalSales.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Desglose por método de pago */}
      <div className="mb-4">
        <div className="text-center font-bold mb-2 text-xs">VENTAS POR MÉTODO</div>
        <div className="flex justify-between text-xs">
          <span>Efectivo:</span>
          <span>Bs {data.totalCashSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Transferencia:</span>
          <span>Bs {data.totalTransferSales.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Resumen de caja - SIMPLIFICADO */}
      <div className="mb-4">
        <div className="text-center font-bold mb-2">RESUMEN DE CAJA</div>
        
        <div className="flex justify-between text-xs">
          <span>Monto Inicial:</span>
          <span>Bs {data.initialAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>(+) Ventas Efectivo:</span>
          <span>Bs {data.totalCashSales.toFixed(2)}</span>
        </div>
        {data.totalDeposits != null && data.totalDeposits > 0 && (
          <div className="flex justify-between text-xs">
            <span>(+) Ingresos:</span>
            <span>Bs {data.totalDeposits.toFixed(2)}</span>
          </div>
        )}
        {data.totalWithdrawals != null && data.totalWithdrawals > 0 && (
          <div className="flex justify-between text-xs">
            <span>(-) Retiros:</span>
            <span>Bs {data.totalWithdrawals.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-gray-300 my-1"></div>
        
        <div className="flex justify-between font-bold text-sm">
          <span>EFECTIVO ESPERADO:</span>
          <span>Bs {(data.initialAmount + data.totalCashSales + (data.totalDeposits || 0) - (data.totalWithdrawals || 0)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm">
          <span>EFECTIVO CONTADO:</span>
          <span>Bs {data.totalCash.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-300 my-1"></div>
        
        <div className={`flex justify-between font-bold text-sm ${
          data.difference === 0 ? '' : 
          data.difference > 0 ? '' : ''
        }`}>
          <span>DIFERENCIA:</span>
          <span>{data.difference === 0 ? '✓ Bs 0.00' : `Bs ${data.difference.toFixed(2)} (${data.difference > 0 ? 'Sobrante' : 'Faltante'})`}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-400 my-2"></div>

      {/* Footer */}
      <div className="text-center text-xs mt-3">
        <div>Sistema POS v1.0</div>
        <div className="mt-1">════════════════</div>
      </div>
    </div>
    </div>
  );
};
