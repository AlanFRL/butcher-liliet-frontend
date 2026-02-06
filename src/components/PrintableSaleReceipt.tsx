import React, { useEffect } from "react";
// USAR CSS EXTERNO para evitar acumulación de tags <style>
import "./ThermalReceiptSale.css";

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
                src="/logo_print.png" 
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
            <p className="text-xs">3er Anillo Interno #123</p>
            <p className="text-xs">Tel: 62409387</p>
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
              const hasActualWeight = item.actualWeight && item.actualWeight > 0;
              const actualWeight = item.actualWeight || 0;
              const pricePerKg = hasActualWeight ? (item.price / actualWeight) : item.price;
              const itemSubtotalBeforeDiscount = item.quantity * item.price;
              const itemDiscount = item.discount || 0;
              
              return (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>
                      {hasActualWeight ? (
                        // Producto en lote (vacuum-packed): peso × precio/kg
                        `${actualWeight.toFixed(3)} kg × Bs ${pricePerKg.toFixed(2)}/kg`
                      ) : item.unit === "kg" ? (
                        // Producto por peso: peso × precio/kg
                        `${item.quantity.toFixed(3)} kg × Bs ${item.price.toFixed(2)}/kg`
                      ) : (
                        // Producto por unidad: qty × precio
                        `${item.quantity.toFixed(0)} ${item.unit} × Bs ${item.price.toFixed(2)}`
                      )}
                    </span>
                    <span className="font-bold">Bs {itemSubtotalBeforeDiscount.toFixed(2)}</span>
                  </div>
                  {itemDiscount > 0 && (
                    <div className="flex justify-between text-xs text-red-600 ml-2">
                      <span>Descuento</span>
                      <span>-Bs {itemDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totales */}
          <div className="mb-2 pb-2 border-b-2 border-gray-900">
            <div className="flex justify-between text-xs mb-1">
              <span>Subtotal:</span>
              <span className="font-bold">Bs {data.subtotal.toFixed(2)}</span>
            </div>

            {data.discount > 0 && (
              <div className="flex justify-between text-xs mb-1 text-red-600">
                <span>Descuento:</span>
                <span className="font-bold">-Bs {data.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-base mt-1">
              <span>TOTAL:</span>
              <span>Bs {data.total.toFixed(2)}</span>
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
                {data.change !== undefined && (
                  <div className="flex justify-between text-xs font-bold">
                    <span>Cambio:</span>
                    <span>Bs {data.change.toFixed(2)}</span>
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
