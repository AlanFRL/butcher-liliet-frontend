import React, { useEffect, useRef } from "react";
import "./ThermalReceiptSale.css";
import logoPrint from "../assets/logo_print.png";

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
      discount?: number;
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
  printable?: boolean; // Marca este recibo como el único que debe imprimirse
}

export const ThermalReceiptSale: React.FC<ThermalReceiptSaleProps> = ({ data, printable = false }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Log para depuración
  console.log('🖨️ [ThermalReceiptSale] Component RENDERED:', {
    saleId: data.saleId.slice(-8),
    printable: printable,
    itemsCount: data.items.length,
  });

  // Detectar eventos de impresión y capturar estilos
  useEffect(() => {
    console.log('🟢 [ThermalReceiptSale] Component MOUNTED for sale:', data.saleId.slice(-8), 'printable:', printable);
    
    const beforePrint = () => {
      console.log('🎯 [POS PRINT EVENT] beforeprint fired for sale:', data.saleId.slice(-8));
      
      // Capturar información del DOM
      const allReceipts = document.querySelectorAll('.thermal-receipt-sale');
      const printableReceipts = document.querySelectorAll('.thermal-receipt-sale[data-printable="true"]');
      
      console.log('📊 [DEBUG] DOM state:', { 
        total: allReceipts.length, 
        printable: printableReceipts.length 
      });
      
      // Capturar estilos computados del recibo printable
      if (receiptRef.current && printable) {
        const styles = window.getComputedStyle(receiptRef.current);
        console.log('🔍 [DEBUG] Computed styles for THIS receipt:', {
          width: styles.width,
          maxWidth: styles.maxWidth,
          fontSize: styles.fontSize,
          visibility: styles.visibility,
          display: styles.display,
          position: styles.position,
          transform: styles.transform,
        });
        
        // Verificar el inner
        const inner = receiptRef.current.querySelector('.thermal-receipt-sale__inner');
        if (inner) {
          const innerStyles = window.getComputedStyle(inner);
          console.log('🔍 [DEBUG] Inner styles:', {
            fontSize: innerStyles.fontSize,
            fontWeight: innerStyles.fontWeight,
            padding: innerStyles.padding,
          });
        }
      }
      
      // Log de todos los recibos
      allReceipts.forEach((el, i) => {
        const styles = window.getComputedStyle(el);
        console.log(`📋 [DEBUG] Receipt ${i}:`, {
          printable: el.getAttribute('data-printable'),
          width: styles.width,
          visibility: styles.visibility,
          display: styles.display,
        });
      });
    };

    const afterPrint = () => {
      console.log('✅ [POS PRINT EVENT] afterprint fired for sale:', data.saleId.slice(-8));
    };

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);

    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, [data.saleId, printable]);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Efectivo";
      case "TRANSFER":
        return "Transferencia";
      case "CARD":
        return "Tarjeta";
      case "MIXED":
        return "Mixto";
      default:
        return method;
    }
  };

  // Estilos de impresión inyectados directamente para garantizar que se apliquen
  const printStyles = printable ? `
    @media print {
      @page { size: 70mm auto !important; margin: 0 !important; }
      html, body { margin: 0 !important; padding: 0 !important; width: 70mm !important; }
      body * { visibility: hidden !important; }
      
      .thermal-receipt-sale[data-printable="true"],
      .thermal-receipt-sale[data-printable="true"] * { 
        visibility: visible !important; 
      }
      
      .thermal-receipt-sale[data-printable="true"] {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 70mm !important;
        max-width: 70mm !important;
        min-width: 70mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        z-index: 999999 !important;
      }
      
      .thermal-receipt-sale[data-printable="true"] .thermal-receipt-sale__inner {
        width: 100% !important;
        padding: 2mm !important;
        font-family: "Courier New", monospace !important;
        font-size: 10pt !important;
        font-weight: 600 !important;
        line-height: 1.3 !important;
        color: #000 !important;
        background: #fff !important;
      }
      
      .thermal-receipt-sale[data-printable="true"] h1 {
        font-size: 12pt !important;
        font-weight: 700 !important;
      }
      
      .thermal-receipt-sale[data-printable="true"] .text-xs { font-size: 8pt !important; }
      .thermal-receipt-sale[data-printable="true"] .text-lg { font-size: 11pt !important; }
      .thermal-receipt-sale[data-printable="true"] .font-bold { font-weight: 700 !important; }
      .thermal-receipt-sale[data-printable="true"] .font-semibold { font-weight: 700 !important; }
      
      .thermal-receipt-sale:not([data-printable="true"]) { display: none !important; }
      .no-print { display: none !important; }
      .hidden { display: block !important; visibility: visible !important; }
      .print\\:block { display: block !important; visibility: visible !important; }
    }
  ` : '';

  return (
    <>
      {printable && <style dangerouslySetInnerHTML={{ __html: printStyles }} />}
      <div
        ref={receiptRef}
        className={`thermal-receipt-sale bg-white ${printable ? '' : 'no-print'}`}
        data-printable={printable}
      >
        <div className="thermal-receipt-sale__inner">
          {/* Header con Logo */}
          <div className="text-center mb-3 pb-2 border-b-2 border-gray-900">
            {/* Logo centrado */}
            <div className="flex justify-center items-center mb-2">
              <img 
                src={logoPrint} 
                alt="Logo" 
                className="mx-auto"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>
            <h1 className="text-lg font-bold mb-1">BUTCHER LILIETH</h1>
            <p className="text-xs">Entre Av. Centenario y C/Urubó</p>
            <p className="text-xs">Tel: 62409387 - 76276838</p>
            <p className="text-xs mt-1">
              {data.date} - {data.time}
            </p>
          </div>

          {/* Información de venta */}
          <div className="mb-2 pb-2 border-b border-gray-900">
            <div className="flex justify-between text-xs">
              <span>Ticket:</span>
              <span className="font-bold">#{data.saleId.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-2 pb-2 border-b-2 border-gray-900">
            <div className="text-xs font-bold mb-2 pb-1 border-b border-gray-900">PRODUCTOS</div>
            {data.items.map((item, index) => {
              console.log('🖨️ [ThermalReceipt] Item data:', {
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                actualWeight: item.actualWeight,
                unit: item.unit,
                discount: item.discount,
                subtotal: item.subtotal,
              });
              
              const itemDiscount = item.discount || 0;
              // Para productos con lote, usar actualWeight en lugar de quantity
              const effectiveQuantity = item.actualWeight || item.quantity;
              const effectiveUnit = item.actualWeight ? 'kg' : item.unit;
              const itemSubtotalBeforeDiscount = Math.round(effectiveQuantity * item.price);
              const itemFinalTotal = Math.round(itemSubtotalBeforeDiscount - itemDiscount);
              
              console.log('🖨️ [ThermalReceipt] Calculated:', {
                effectiveQuantity,
                effectiveUnit,
                itemSubtotalBeforeDiscount,
                itemFinalTotal,
              });
              
              return (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>
                      {effectiveQuantity.toFixed(effectiveUnit === "kg" ? 3 : 0)} {effectiveUnit} × Bs{" "}
                      {Math.round(item.price)}/{effectiveUnit}
                    </span>
                    <span className="font-bold">Bs {itemSubtotalBeforeDiscount}</span>
                  </div>
                  {itemDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-red-600 ml-2">
                        <span>Descuento</span>
                        <span>-Bs {Math.round(itemDiscount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold ml-2">
                        <span>Subtotal:</span>
                        <span>Bs {itemFinalTotal}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totales */}
          <div className="mb-2 pb-2 border-b-2 border-gray-900">
            {data.discount > 0 && (
              <>
                <div className="flex justify-between text-xs mb-1">
                  <span>Subtotal:</span>
                  <span className="font-bold">Bs {Math.round(data.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1 text-red-600">
                  <span>Descuento:</span>
                  <span className="font-bold">-Bs {Math.round(data.discount)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between font-bold text-base mt-1">
              <span>TOTAL:</span>
              <span>Bs {Math.round(data.total)}</span>
            </div>
          </div>

          {/* Información de pago */}
          <div className="mb-2 pb-2 border-b border-gray-900">
            <div className="flex justify-between text-xs mb-1">
              <span>Método de pago:</span>
              <span className="font-bold">{getPaymentMethodLabel(data.paymentMethod)}</span>
            </div>

            {data.paymentMethod === "CASH" && data.cashPaid !== undefined && (
              <>
                <div className="flex justify-between text-xs mb-1">
                  <span>Pagado:</span>
                  <span className="font-bold">Bs {data.cashPaid.toFixed(2)}</span>
                </div>
                {data.change !== undefined && data.change > 0 && (
                  <div className="flex justify-between text-xs font-bold">
                    <span>Cambio:</span>
                    <span>Bs {Math.round(data.change).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Atendido por - Al final */}
          <div className="mb-2 pb-2 border-b border-gray-900">
            <div className="flex justify-between text-xs">
              <span>Atendido por:</span>
              <span className="font-bold">{data.cashier}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs mt-2">
            <p className="mb-1 font-bold">¡Gracias por su compra!</p>
            <p className="font-semibold">Vuelva pronto</p>
          </div>
        </div>
      </div>
    </>
  );
};
