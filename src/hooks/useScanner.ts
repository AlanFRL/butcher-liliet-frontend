import { useEffect, useRef, useState } from 'react';
import { parseScaleBarcode } from '../utils/barcodeParser';
import { productsApi } from '../services/api';
import { useCartStore } from '../store';
import type { Product } from '../types';

interface ScannerFeedback {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

interface ScaleMetadata {
  barcode: string;
  subtotal: number;
  customUnitPrice?: number;
  scaleData?: {
    weightKg: number;
    originalPrice: number;
    systemPrice: number;
    priceDiff: number;
  };
}

interface UseScannerProps {
  isActive: boolean; // Si el scanner debe estar activo (sin modales abiertos)
  onProductScanned?: (product: Product, qty: number, metadata?: ScaleMetadata) => void; // Callback personalizado
}

export const useScanner = ({ isActive, onProductScanned }: UseScannerProps) => {
  const [scannerFeedback, setScannerFeedback] = useState<ScannerFeedback>({
    show: false,
    message: '',
    type: 'success'
  });
  
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const scanTimeoutRef = useRef<number | null>(null);
  
  const { addToCart } = useCartStore();

  const showScannerFeedback = (message: string, type: 'success' | 'error') => {
    setScannerFeedback({ show: true, message, type });
    setTimeout(() => {
      setScannerFeedback({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('🔍 Código escaneado:', barcode);
    
    try {
      // Intentar parsear como código de balanza (20 dígitos: PLU + peso + precio)
      const scaleData = parseScaleBarcode(barcode);
      
      if (scaleData) {
        // Es código de balanza - buscar producto por PLU
        console.log('⚖️ Código de balanza detectado:', scaleData);
        
        const productResponse = await productsApi.getByBarcode(scaleData.productCode);
        
        if (!productResponse) {
          showScannerFeedback(`Producto ${scaleData.productCode} no encontrado`, 'error');
          return;
        }
        
        // Convertir ProductResponse a Product
        const product = {
          ...productResponse,
          unit: productResponse.unit || 'kg',
          price: parseFloat(productResponse.price),
          stockQuantity: productResponse.stockQuantity ? parseFloat(productResponse.stockQuantity) : undefined,
          minStock: productResponse.minStock ? parseFloat(productResponse.minStock) : undefined,
          taxRate: 0,
          isFavorite: false,
        } as unknown as Product;
        
        // Calcular diferencia de precio (sistema vs balanza)
        const expectedTotal = Math.round(scaleData.weightKg * product.price);
        const actualTotal = scaleData.totalPrice;
        const priceDiff = actualTotal - expectedTotal;
        
        // Si hay diferencia, calcular unitPrice real (validación silenciosa)
        let customUnitPrice: number | undefined = undefined;
        if (Math.abs(priceDiff) >= 1) {
          customUnitPrice = actualTotal / scaleData.weightKg;
          
          // LOG INTERNO para auditoría (no mostrar al cliente)
          console.log(`⚠️ [AUDIT] Precio balanza difiere. Producto: ${product.name}, Esperado: Bs ${expectedTotal}, Real: Bs ${actualTotal}, Diff: ${priceDiff > 0 ? '+' : ''}${priceDiff}`);
        }
        
        const metadata: ScaleMetadata = {
          barcode: scaleData.rawBarcode,
          subtotal: actualTotal,
          customUnitPrice: customUnitPrice,
          scaleData: {
            weightKg: scaleData.weightKg,
            originalPrice: actualTotal,
            systemPrice: expectedTotal,
            priceDiff: priceDiff
          }
        };
        
        // Usar callback personalizado o addToCart por defecto
        if (onProductScanned) {
          onProductScanned(product, scaleData.weightKg, metadata);
        } else {
          addToCart(product, scaleData.weightKg, metadata);
        }
        
        // Feedback simple SIN mencionar precios ni diferencias
        showScannerFeedback(
          `${product.name} - ${scaleData.weightKg.toFixed(3)}kg agregado`,
          'success'
        );
        return;
      }
      
      // No es código de balanza - buscar como código estándar
      const productResponse = await productsApi.getByBarcode(barcode);
      
      if (!productResponse) {
        showScannerFeedback('Producto no encontrado: ' + barcode, 'error');
        return;
      }
      
      // Convertir ProductResponse a Product
      const product = {
        ...productResponse,
        unit: productResponse.unit || 'unidad',
        price: parseFloat(productResponse.price),
        stockQuantity: productResponse.stockQuantity ? parseFloat(productResponse.stockQuantity) : undefined,
        minStock: productResponse.minStock ? parseFloat(productResponse.minStock) : undefined,
        taxRate: 0,
        isFavorite: false,
      } as unknown as Product;
      
      console.log('✅ Producto encontrado:', product.name);
      
      // Agregar con cantidad por defecto
      const defaultQty = 1;
      
      // Usar callback personalizado o addToCart por defecto
      if (onProductScanned) {
        onProductScanned(product, defaultQty);
      } else {
        addToCart(product, defaultQty);
      }
      
      showScannerFeedback(`${product.name} agregado`, 'success');
    } catch (error) {
      console.error('❌ Error buscando producto:', error);
      showScannerFeedback('Error al buscar producto', 'error');
    }
  };

  // Captura de código de barras
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si hay un campo de texto enfocado
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInputField) return;
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      
      // Si es Enter, procesar el buffer acumulado
      if (e.key === 'Enter') {
        const barcode = barcodeBufferRef.current;
        
        if (barcode.length >= 6) {
          handleBarcodeScanned(barcode);
          e.preventDefault();
        }
        
        // Limpiar buffer
        barcodeBufferRef.current = '';
        lastKeyTimeRef.current = 0;
        
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = null;
        }
        return;
      }
      
      // Solo acumular caracteres alfanuméricos
      if (e.key.length === 1) {
        // Si pasó mucho tiempo, reiniciar buffer
        if (timeDiff > 150 && barcodeBufferRef.current.length > 0) {
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
        
        lastKeyTimeRef.current = currentTime;
        
        // Cancelar timeout anterior
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        
        // Procesar después de 200ms sin más teclas
        scanTimeoutRef.current = setTimeout(() => {
          const barcode = barcodeBufferRef.current;
          
          if (barcode.length >= 6) {
            handleBarcodeScanned(barcode);
            barcodeBufferRef.current = '';
            lastKeyTimeRef.current = 0;
          }
        }, 200);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [isActive]);

  return {
    scannerFeedback
  };
};
