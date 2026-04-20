import React, { useEffect } from "react";
// USAR CSS EXTERNO para evitar acumulación de tags <style>
import "./ThermalReceiptSale.css";

const logoPrint = new URL('../assets/logo_print.png', import.meta.url).href;

interface PrintableSaleReceiptProps {
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
    cashAmount?: number | string;
    transferAmount?: number | string;
    cardAmount?: number | string;
    change?: number;
  };
  printable?: boolean;
}

export const PrintableSaleReceipt: React.FC<PrintableSaleReceiptProps> = ({ data, printable = false }) => {
  // Log para depuración
  console.log('🖨️ [PrintableSaleReceipt] Component RENDERED:', {
    saleId: data.saleId.slice(-8),
    printable: printable,
    itemsCount: data.items.length,
    timestamp: new Date().toISOString(),
    stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
  });

  // Detectar eventos de impresión
  useEffect(() => {
    console.log('🟢 [PrintableSaleReceipt] Component MOUNTED for sale:', data.saleId.slice(-8), 'printable:', printable);
    
    const beforePrint = () => {
      console.log('🎯 [PRINT EVENT] beforeprint fired for sale:', data.saleId.slice(-8));
      
      // Buscar el recibo
      const receipt = document.querySelector('.thermal-receipt-sale[data-printable="true"]') as HTMLElement;
      if (receipt) {
        const styles = window.getComputedStyle(receipt);
        console.log('📐 [PRINT EVENT] Receipt COMPUTED styles during print:', {
          position: styles.position,
          width: styles.width,
          maxWidth: styles.maxWidth,
          left: styles.left,
          top: styles.top,
          visibility: styles.visibility,
          display: styles.display,
          zIndex: styles.zIndex,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
        });
        
        // Verificar el inner
        const inner = receipt.querySelector('.thermal-receipt-sale__inner') as HTMLElement;
        if (inner) {
          const innerStyles = window.getComputedStyle(inner);
          console.log('📐 [PRINT EVENT] Inner COMPUTED styles:', {
            fontSize: innerStyles.fontSize,
            fontWeight: innerStyles.fontWeight,
            width: innerStyles.width,
            padding: innerStyles.padding,
          });
        }
        
        // Verificar ancestros
        let parent = receipt.parentElement;
        let level = 1;
        while (parent && level <= 5) {
          const parentStyles = window.getComputedStyle(parent);
          console.log(`📐 [PRINT EVENT] Ancestor ${level} (${parent.className.slice(0,50)}):`, {
            display: parentStyles.display,
            visibility: parentStyles.visibility,
            width: parentStyles.width,
            height: parentStyles.height,
            position: parentStyles.position,
          });
          parent = parent.parentElement;
          level++;
        }
      }
      
      // Verificar qué elementos son visibles
      const allElements = document.querySelectorAll('body *');
      let visibleCount = 0;
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.visibility === 'visible' && styles.display !== 'none') {
          visibleCount++;
        }
      });
      console.log('👁️ [PRINT EVENT] Total visible elements during print:', visibleCount);
      
      // Verificar la URL actual
      console.log('🌐 [PRINT EVENT] Current URL:', window.location.pathname);
    };

    const afterPrint = () => {
      console.log('✅ [PRINT EVENT] afterprint fired for sale:', data.saleId.slice(-8));
    };

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);

    return () => {
      console.log('🔴 [PrintableSaleReceipt] Component UNMOUNTED for sale:', data.saleId.slice(-8));
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

  return (
    <div
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
            <p className="text-xs">3er Anillo Interno</p>
            <p className="text-xs">Entre Av. Centenario y C/Urubó</p>
            <p className="text-xs">Tel: 76276838</p>
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
              const itemDiscount = item.discount || 0;
              // Para productos con lote, usar actualWeight en lugar de quantity
              const effectiveQuantity = item.actualWeight || item.quantity;
              const effectiveUnit = item.actualWeight ? 'kg' : item.unit;
              const itemSubtotalBeforeDiscount = Math.round(effectiveQuantity * item.price);
              
              return (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                      <span>{(() => {
                        const isWeight = (item as any).saleType === 'WEIGHT' || (item as any).product?.saleType === 'WEIGHT' || item.unit === 'KG' || item.unit?.toLowerCase() === 'kg' || effectiveUnit === 'kg';
                        const hasDiscount = itemDiscount > 0;
                        const fallbackUIPrice = (item.subtotal && effectiveQuantity) ? item.subtotal / effectiveQuantity : (itemSubtotalBeforeDiscount - itemDiscount) / effectiveQuantity;
                        const appliedUP = (item as any).appliedUnitPrice ?? (isWeight && hasDiscount ? fallbackUIPrice : item.price);
                        
                        if ((item as any).appliedUnitPrice || (isWeight && hasDiscount)) {
                          return (
                            <>
                              {effectiveQuantity.toFixed(effectiveUnit === "kg" ? 3 : 0)} {effectiveUnit} &times; Bs{" "}
                              <span className="line-through text-gray-400">Math.round({item.price})</span> <span className="font-bold">Bs {Math.round(appliedUP)}</span>/{effectiveUnit}
                            </>
                          );
                        }
                        return (
                          <>
                            {effectiveQuantity.toFixed(effectiveUnit === "kg" ? 3 : 0)} {effectiveUnit} &times; Bs{" "}
                            {Math.round(item.price)}/{effectiveUnit}
                          </>
                        );
                      })()}</span>
                      <span className="font-bold">Bs {itemSubtotalBeforeDiscount}</span>
                    </div>
                  {itemDiscount > 0 && (
                    <div className="flex justify-between text-xs text-red-600 ml-2">
                      <span>Descuento</span>
                      <span>Bs {Math.round(itemDiscount)}</span>
                    </div>
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
                  <span className="font-bold">Bs {Math.round(data.discount)}</span>
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

            {data.paymentMethod === "MIXED" && (
              <>
                {(data as any).cashAmount > 0 && (
                   <div className="flex justify-between text-xs mb-1">
                    <span>Efectivo:</span>
                    <span className="font-bold">Bs {(data as any).cashAmount.toFixed(2)}</span>
                  </div>
                )}
                {(data as any).transferAmount > 0 && (
                   <div className="flex justify-between text-xs mb-1">
                    <span>QR/Trns:</span>
                    <span className="font-bold">Bs {(data as any).transferAmount.toFixed(2)}</span>
                  </div>
                )}
                {(data as any).cardAmount > 0 && (
                   <div className="flex justify-between text-xs mb-1">
                    <span>Tarjeta:</span>
                    <span className="font-bold">Bs {(data as any).cardAmount.toFixed(2)}</span>
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
  );
};
