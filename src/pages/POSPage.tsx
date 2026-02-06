import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Star, Package, Weight, Printer, Tag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Modal } from '../components/ui';
import { useProductStore, useCartStore, useCashStore, useSalesStore, useAuthStore } from '../store';
import { PrintableSaleReceipt } from '../components/PrintableSaleReceipt';
import { ItemDiscountModal } from '../components/ItemDiscountModal';
import { productsApi } from '../services/api';
import { parseScaleBarcode } from '../utils/barcodeParser';
import type { Product, ProductBatch, CartItem } from '../types';

export const POSPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('CASH');
  const [cashPaid, setCashPaid] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  // Estado local para los inputs de cantidad (permite edición libre)
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  // Estados para modal de lotes
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [availableBatches, setAvailableBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showManualBatchForm, setShowManualBatchForm] = useState(false);
  const [manualBatchData, setManualBatchData] = useState({ weight: '', price: '' });
  
  // Estados para descuentos
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  
  // Estados para captura de código de barras (usar refs para evitar re-renders)
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const scanTimeoutRef = useRef<number | null>(null);
  
  // Estados para UI del scanner
  const [scannerFeedback, setScannerFeedback] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSession } = useCashStore();
  const { currentUser } = useAuthStore();
  const { products, categories, getFavoriteProducts, toggleProductFavorite } = useProductStore();
  const cartStore = useCartStore();
  const { cartItems, addToCart, addBatchToCart, updateCartItem, removeFromCart, clearCart, getCartTotal, getCartSubtotal, setItemDiscount, setItemUnitPrice, globalDiscount, setGlobalDiscount } = cartStore;
  const { completeSale } = useSalesStore();
  
  // Obtener orderId si viene desde pedidos
  const orderId = location.state?.orderId as string | undefined;
  
  // ============= CAPTURA DE CÓDIGO DE BARRAS =============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si hay modales abiertos
      if (showPaymentModal || showBatchModal || showSuccessModal || showDiscountModal) {
        return;
      }
      
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
        
        // Procesar después de 200ms sin más teclas (algunos lectores no envían Enter)
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
  }, [showPaymentModal, showBatchModal, showSuccessModal, showDiscountModal]);
  
  const loadBatches = async (productId: string): Promise<ProductBatch[]> => {
    setLoadingBatches(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/product-batches?includeReservationStatus=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('butcher_auth_token')}`
        }
      });
      
      if (response.ok) {
        const allBatches: ProductBatch[] = await response.json();
        console.log('📦 Total de lotes recibidos:', allBatches.length);
        
        // Obtener IDs de lotes ya en el carrito directamente del store (estado más reciente)
        const currentCartItems = useCartStore.getState().cartItems;
        const batchIdsInCart = currentCartItems
          .filter(item => item.batchId)
          .map(item => item.batchId);
        
        console.log('🛒 Lotes ya en carrito:', batchIdsInCart);
        
        // Filtrar solo lotes del producto seleccionado, no vendidos, no reservados y no en carrito
        const filtered = allBatches.filter(
          b => b.productId === productId && 
               !b.isSold && 
               !(b as any).isReserved &&
               !batchIdsInCart.includes(b.id)
        );
        
        console.log('📦 Lotes disponibles para producto', productId + ':', filtered.length);
        filtered.forEach(b => {
          console.log(`  - Lote ${b.batchNumber}: ${b.actualWeight}kg, Bs ${b.unitPrice}`);
        });
        
        setAvailableBatches(filtered);
        return filtered;
      } else {
        console.error('Error loading batches');
        setAvailableBatches([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      setAvailableBatches([]);
      return [];
    } finally {
      setLoadingBatches(false);
    }
  };
  
  const handleBarcodeScanned = async (barcode: string) => {
    console.log('🔍 Código escaneado:', barcode);
    
    try {
      // Intentar parsear como código de balanza
      const scaleData = parseScaleBarcode(barcode);
      
      if (scaleData) {
        // Es código de balanza - buscar producto por código de 6 dígitos
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
        
        // Verificar si es producto al vacío
        if (product.inventoryType === 'VACUUM_PACKED') {
          // Buscar lote existente que coincida con peso y precio
          const allAvailableBatches = await loadBatches(product.id);
          console.log('🔍 Buscando lote con peso:', scaleData.weightKg, 'kg y precio:', scaleData.totalPrice, 'Bs');
          
          const batches = allAvailableBatches.filter(b => {
            const weightDiff = Math.abs(Number(b.actualWeight) - scaleData.weightKg);
            const priceDiff = Math.abs(Number(b.unitPrice) - scaleData.totalPrice);
            console.log(`  Comparando con lote ${b.batchNumber}: peso=${b.actualWeight} (diff=${weightDiff.toFixed(4)}), precio=${b.unitPrice} (diff=${priceDiff.toFixed(2)})`);
            return weightDiff < 0.001 && priceDiff < 0.01;
          });
          
          console.log('✅ Lotes coincidentes:', batches.length);
          
          if (batches.length > 0) {
            // Lote encontrado - usar FIFO (el más antiguo)
            const selectedBatch = batches.sort((a, b) => 
              new Date(a.packedAt).getTime() - new Date(b.packedAt).getTime()
            )[0];
            
            addBatchToCart(product, {
              id: selectedBatch.id,
              batchNumber: selectedBatch.batchNumber,
              actualWeight: Number(selectedBatch.actualWeight),
              unitPrice: Number(selectedBatch.unitPrice)
            });
            
            showScannerFeedback(
              `${product.name} - Lote ${selectedBatch.batchNumber} - ${scaleData.weightKg.toFixed(3)}kg`,
              'success'
            );
          } else {
            // Lote NO encontrado - agregar como fantasma
            console.log('⚠️ Lote no encontrado, agregando como fantasma');
            
            addBatchToCart(product, {
              actualWeight: scaleData.weightKg,
              unitPrice: scaleData.totalPrice,
              needsCreation: true
            });
            
            showScannerFeedback(
              `⚠️ ${product.name} - ${scaleData.weightKg.toFixed(3)}kg - Lote no registrado (se creará al cobrar)`,
              'success'
            );
          }
          return;
        }
        
        // No es al vacío - agregar como producto pesado normal
        addToCart(product, scaleData.weightKg, {
          barcode: scaleData.rawBarcode,
          subtotal: scaleData.totalPrice
        });
        
        showScannerFeedback(
          `${product.name} - ${scaleData.weightKg.toFixed(3)}kg - Bs ${scaleData.totalPrice.toFixed(2)}`,
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
      
      // Para productos al vacío, mostrar modal de lotes
      if (product.inventoryType === 'VACUUM_PACKED') {
        setSelectedProductForBatch(product);
        setShowBatchModal(true);
        await loadBatches(product.id);
        showScannerFeedback('Seleccione el lote de ' + product.name, 'success');
      } else {
        // Agregar con cantidad por defecto
        const defaultQty = product.saleType === 'WEIGHT' ? 1 : 1;
        addToCart(product, defaultQty);
        showScannerFeedback(`${product.name} agregado al carrito`, 'success');
      }
    } catch (error) {
      console.error('❌ Error buscando producto:', error);
      showScannerFeedback('Error al buscar producto', 'error');
    }
  };
  
  const showScannerFeedback = (message: string, type: 'success' | 'error') => {
    setScannerFeedback({ show: true, message, type });
    setTimeout(() => {
      setScannerFeedback({ show: false, message: '', type: 'success' });
    }, 3000);
  };
  
  // Verificar si hay caja abierta
  if (!currentSession || currentSession.status !== 'OPEN') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">Caja Cerrada</h2>
          <p className="text-yellow-700 mb-4">
            Debes abrir caja antes de poder usar el POS
          </p>
          <Button onClick={() => navigate('/cash/open')} variant="primary">
            Abrir Caja
          </Button>
        </div>
      </div>
    );
  }
  
  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchTerm) {
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });
  
  const favoriteProducts = getFavoriteProducts();
  
  const handleAddToCart = async (product: Product) => {
    // Si es producto al vacío, mostrar modal de selección de lotes
    if (product.inventoryType === 'VACUUM_PACKED') {
      setSelectedProductForBatch(product);
      setShowBatchModal(true);
      await loadBatches(product.id);
      return;
    }
    
    // Verificar stock disponible para productos por unidad
    if (product.saleType === 'UNIT' && product.inventoryType === 'UNIT') {
      const currentInCart = cartItems.find(item => item.productId === product.id)?.qty || 0;
      const availableStock = (product.stockUnits || 0) - currentInCart;
      
      if (availableStock <= 0) {
        alert(`No hay stock disponible de ${product.name}`);
        return;
      }
    }
    
    // Para otros productos, agregar normalmente
    const defaultQty = product.saleType === 'WEIGHT' ? 1 : 1;
    addToCart(product, defaultQty);
  };

  const handleSelectBatch = (batch: ProductBatch) => {
    if (!selectedProductForBatch) return;
    
    addBatchToCart(selectedProductForBatch, {
      id: batch.id,
      batchNumber: batch.batchNumber,
      actualWeight: Number(batch.actualWeight),
      unitPrice: Number(batch.unitPrice)
    });
    
    setShowBatchModal(false);
    setSelectedProductForBatch(null);
    setAvailableBatches([]);
    setShowManualBatchForm(false);
    setManualBatchData({ weight: '', price: '' });
  };
  
  const handleAddManualBatch = () => {
    if (!selectedProductForBatch) return;
    
    const weight = parseFloat(manualBatchData.weight);
    const price = parseFloat(manualBatchData.price);
    
    if (isNaN(weight) || weight <= 0 || isNaN(price) || price <= 0) {
      alert('Por favor ingrese peso y precio válidos');
      return;
    }
    
    addBatchToCart(selectedProductForBatch, {
      actualWeight: weight,
      unitPrice: price,
      needsCreation: true
    });
    
    setShowBatchModal(false);
    setSelectedProductForBatch(null);
    setAvailableBatches([]);
    setShowManualBatchForm(false);
    setManualBatchData({ weight: '', price: '' });
  };
  
  // Obtener valor del input (local o del cart)
  const getInputValue = (itemId: string, qty: number, saleType: 'UNIT' | 'WEIGHT') => {
    if (qtyInputs[itemId] !== undefined) {
      return qtyInputs[itemId];
    }
    return saleType === 'WEIGHT' ? qty.toFixed(3) : qty.toString();
  };
  
  // Manejar cambio en input
  const handleQtyInputChange = (itemId: string, value: string) => {
    // Guardar en estado local
    setQtyInputs(prev => ({ ...prev, [itemId]: value }));
  };
  
  // Manejar blur (cuando pierde foco)
  const handleQtyInputBlur = (itemId: string, saleType: 'UNIT' | 'WEIGHT') => {
    const inputValue = qtyInputs[itemId] || '';
    const normalizedValue = inputValue.replace(',', '.');
    
    let finalQty: number;
    
    if (saleType === 'UNIT') {
      // Unidades: debe ser entero >= 1
      const parsed = parseInt(normalizedValue, 10);
      finalQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
      
      // Verificar stock disponible para productos por unidad
      const cartItem = cartItems.find(item => item.id === itemId);
      if (cartItem && cartItem.product.inventoryType === 'UNIT' && cartItem.product.stockUnits !== undefined) {
        const maxStock = cartItem.product.stockUnits;
        if (finalQty > maxStock) {
          alert(`Stock insuficiente. Solo hay ${maxStock} unidades disponibles de ${cartItem.product.name}`);
          finalQty = maxStock;
        }
      }
    } else {
      // Peso: debe ser >= 0.01 con máx 2 decimales
      const parsed = parseFloat(normalizedValue);
      if (isNaN(parsed) || parsed < 0.01) {
        finalQty = 0.01;
      } else {
        // Limitar a 2 decimales
        finalQty = Math.round(parsed * 100) / 100;
      }
    }
    
    // Actualizar cart y limpiar estado local
    updateCartItem(itemId, finalQty);
    setQtyInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[itemId];
      return newInputs;
    });
  };
  
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Validar que no haya items con cantidad 0
    const hasInvalidItems = cartItems.some(item => item.qty <= 0);
    if (hasInvalidItems) {
      alert('Por favor, ingrese cantidades válidas para todos los productos');
      return;
    }
    
    // Pre-llenar con el total si es efectivo
    if (paymentMethod === 'CASH') {
      setCashPaid(Math.round(getCartTotal()).toString());
    }
    
    setShowPaymentModal(true);
  };
  
  const handleCompleteSale = async () => {
    const sale = await completeSale(
      paymentMethod,
      paymentMethod === 'CASH' ? parseFloat(cashPaid) : undefined,
      orderId // Vincular con pedido si existe
    );
    
    if (sale) {
      console.log('✅ [POS] Sale completed, opening success modal:', {
        saleId: sale.id.slice(-8),
        itemsCount: sale.items.length,
        total: sale.total
      });
      setLastSale(sale);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCashPaid('');
      
      // Si venía de un pedido, redirigir a pedidos después
      if (orderId) {
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/orders', { replace: true });
        }, 2000);
      }
    }
  };
  
  const handleNewSale = () => {
    setShowSuccessModal(false);
    setLastSale(null);
    
    // Si venía de un pedido, volver a pedidos
    if (orderId) {
      navigate('/orders', { replace: true });
    }
  };
  
  const handlePrintReceipt = () => {
    console.log('🖨️ [POS] handlePrintReceipt called - IFRAME METHOD');
    
    // Buscar el recibo
    const receipt = document.querySelector('.thermal-receipt-sale[data-printable="true"]');
    if (!receipt) {
      console.error('❌ [POS] Receipt not found!');
      return;
    }
    
    // Obtener el HTML del recibo
    const receiptHTML = receipt.outerHTML;
    
    // Crear iframe temporal
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none; left: -9999px;';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.error('❌ [POS] Could not access iframe document');
      document.body.removeChild(iframe);
      return;
    }
    
    // Escribir el contenido del iframe con estilos inline completos
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo</title>
        <style>
          @page {
            size: 70mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 70mm;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .thermal-receipt-sale {
            width: 70mm;
            max-width: 70mm;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .thermal-receipt-sale__inner {
            width: 100%;
            padding: 2mm;
            font-family: "Courier New", monospace;
            font-size: 10pt;
            line-height: 1.3;
            font-weight: 600;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-xs { font-size: 8pt; }
          .text-sm { font-size: 9pt; }
          .text-lg { font-size: 11pt; font-weight: 700; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .mb-1 { margin-bottom: 0.5mm; }
          .mb-2 { margin-bottom: 1mm; }
          .mb-3 { margin-bottom: 1.5mm; }
          .mb-4 { margin-bottom: 2mm; }
          .mt-2 { margin-top: 1mm; }
          .mt-4 { margin-top: 2mm; }
          .pb-2 { padding-bottom: 1mm; }
          .pb-3 { padding-bottom: 1.5mm; }
          .pt-2 { padding-top: 1mm; }
          .border-b { border-bottom: 0.3mm solid #000; }
          .border-b-2 { border-bottom: 0.5mm solid #000; }
          .border-t { border-top: 0.3mm solid #000; }
          .border-dashed { border-style: dashed; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-gray-400 { border-color: #9ca3af; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .space-y-1 > * + * { margin-top: 0.5mm; }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
      </html>
    `);
    iframeDoc.close();
    
    // Usar un flag para evitar doble impresión
    let printed = false;
    
    const doPrint = () => {
      if (printed) return;
      printed = true;
      
      console.log('📄 [POS] Printing from iframe...');
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Remover iframe después de imprimir
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
          console.log('✅ [POS] Iframe removed');
        }
      }, 1000);
    };
    
    // Esperar a que el iframe cargue
    iframe.onload = () => {
      setTimeout(doPrint, 100);
    };
    
    // Fallback por si onload no se dispara
    setTimeout(() => {
      if (!printed) {
        console.log('📄 [POS] Fallback print trigger...');
        doPrint();
      }
    }, 500);
  };
  
  const getUserDisplayName = () => {
    if (!currentUser) return 'N/A';
    return currentUser.fullName || currentUser.username;
  };
  
  // Handlers para modal de descuento
  const handleOpenDiscountModal = (item: CartItem) => {
    setSelectedItemForDiscount(item);
    setShowDiscountModal(true);
  };
  
  const handleApplyDiscount = (discount: number) => {
    if (selectedItemForDiscount) {
      setItemDiscount(selectedItemForDiscount.id, discount);
    }
  };
  
  const handleApplyUnitPrice = (newUnitPrice: number) => {
    if (selectedItemForDiscount) {
      setItemUnitPrice(selectedItemForDiscount.id, newUnitPrice);
    }
  };
  
  const cartTotal = Math.round(getCartTotal());
  const cashPaidNum = Math.round(parseFloat(cashPaid) || 0);
  const change = cashPaidNum - cartTotal;
  const canCompleteSale =
    paymentMethod === 'CASH' ? cashPaidNum >= cartTotal : true;
  
  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Feedback de Escaneo */}
      {scannerFeedback.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
          scannerFeedback.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{scannerFeedback.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{scannerFeedback.message}</span>
          </div>
        </div>
      )}
      
      {/* Panel Izquierdo: Productos */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Indicador si viene de pedido */}
        {orderId && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-blue-800">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-medium">Cobrando pedido - Items pre-cargados</span>
              </div>
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
        
        {/* Barra de búsqueda */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>
        </div>
        
        {/* Categorías */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Productos Favoritos */}
        {!searchTerm && !selectedCategory && favoriteProducts.length > 0 && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <Star className="w-4 h-4 mr-1 text-accent-500 fill-current" />
              Favoritos
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2" style={{ maxHeight: '200px', flexWrap: 'wrap' }}>
                {favoriteProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="bg-accent-50 border-2 border-accent-300 rounded-lg p-3 hover:bg-accent-100 transition-all text-left flex-shrink-0"
                    style={{ minWidth: '160px', maxWidth: '200px' }}
                  >
                    <p className="font-bold text-gray-900 text-sm mb-1 truncate">
                      {product.name}
                    </p>
                    <p className="text-accent-700 font-semibold">
                      Bs {product.price.toFixed(2)}/{product.unit}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              // Calcular stock disponible para productos por unidad
              const currentInCart = cartItems.find(item => item.productId === product.id)?.qty || 0;
              const availableStock = product.saleType === 'UNIT' && product.inventoryType === 'UNIT' && product.stockUnits !== undefined
                ? product.stockUnits - currentInCart
                : null;
              const isOutOfStock = availableStock !== null && availableStock <= 0;
              
              return (
              <div
                key={product.id}
                className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all relative group ${isOutOfStock ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProductFavorite(product.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-accent-50 transition-colors"
                  title={product.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Star className={`w-4 h-4 ${product.isFavorite ? 'text-accent-500 fill-current' : 'text-gray-300'}`} />
                </button>
                
                {/* Indicador de stock */}
                {availableStock !== null && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      availableStock <= 0 ? 'bg-red-100 text-red-700' :
                      availableStock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {availableStock <= 0 ? 'Sin stock' : `Stock: ${availableStock}`}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full text-left"
                  disabled={isOutOfStock}
                >
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 pr-8 mt-6">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary-700">
                      Bs {product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">por {product.unit}</p>
                  </div>
                  {!isOutOfStock && (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                </button>
              </div>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Panel Derecho: Carrito */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Header del Carrito */}
        <div className="p-4 border-b border-gray-200 bg-primary-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2 text-primary-600" />
              Carrito
            </h2>
            <div className="flex items-center space-x-2">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">{cartItems.length} items</p>
        </div>
        
        {/* Items del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">El carrito está vacío</p>
            </div>
          ) : (
            cartItems.map((item) => {
              // Contar cuántos items hay del mismo producto
              const sameProductItems = cartItems.filter(i => i.productId === item.productId);
              const itemIndex = sameProductItems.findIndex(i => i.id === item.id) + 1;
              const showCounter = sameProductItems.length > 1;
              
              return (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {item.productName}
                      </h4>
                      {showCounter && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                          #{itemIndex}
                        </span>
                      )}
                      {item.scannedBarcode && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                          📟 Escaneado
                        </span>
                      )}
                      {item.needsBatchCreation && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                          ⚠️ No registrado
                        </span>
                      )}
                    </div>
                    {item.batchNumber && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Package className="w-3 h-3 mr-1" />
                        Lote: {item.batchNumber}
                        {item.actualWeight && (
                          <span className="ml-2">
                            ({Number(item.actualWeight).toFixed(3)} kg)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Si es lote (registrado o fantasma) o producto escaneado, no permitir cambiar cantidad */}
                {(item.batchId || item.needsBatchCreation || item.scannedBarcode) ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {item.batchId || item.needsBatchCreation 
                          ? 'Cantidad: 1 paquete'
                          : `${item.qty.toFixed(3)} ${item.product.unit}`
                        }
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-700">
                          Bs {Math.round(item.total)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botón de descuento y visualización */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleOpenDiscountModal(item)}
                        className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {item.discount > 0 ? 'Modificar desc.' : 'Aplicar desc.'}
                      </button>
                      {item.discount > 0 && (
                        <span className="text-xs font-semibold text-red-600">
                          -Bs {item.discount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const step = item.product.saleType === 'UNIT' ? 1 : 0.5;
                            const newQty = item.qty - step;
                            if (newQty > 0) updateCartItem(item.id, newQty);
                          }}
                          className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      <input
                        type="text"
                        value={getInputValue(item.id, item.qty, item.product.saleType)}
                        onChange={(e) => handleQtyInputChange(item.id, e.target.value)}
                        onBlur={() => handleQtyInputBlur(item.id, item.product.saleType)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-16 text-center border border-gray-300 rounded py-1 font-medium"
                      />
                      <button
                        onClick={() => {
                          const step = item.product.saleType === 'UNIT' ? 1 : 0.5;
                          const newQty = item.qty + step;
                          
                          // Verificar stock para productos por unidad
                          if (item.product.saleType === 'UNIT' && item.product.inventoryType === 'UNIT' && item.product.stockUnits !== undefined) {
                            if (newQty > item.product.stockUnits) {
                              alert(`Stock insuficiente. Solo hay ${item.product.stockUnits} unidades disponibles`);
                              return;
                            }
                          }
                          
                          updateCartItem(item.id, newQty);
                        }}
                        className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-500">{item.product.unit}</span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Bs {item.unitPrice.toFixed(2)}/{item.product.unit}
                      </p>
                      <p className="text-lg font-bold text-primary-700">
                        Bs {Math.round(item.total)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botón de descuento y visualización */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleOpenDiscountModal(item)}
                      className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {item.discount > 0 ? 'Modificar desc.' : 'Aplicar desc.'}
                    </button>
                    {item.discount > 0 && (
                      <span className="text-xs font-semibold text-red-600">
                        -Bs {item.discount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                )}
              </div>
              );
            })
          )}
        </div>
        
        {/* Total y Pagar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                Bs {Math.round(cartTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-gray-900">TOTAL:</span>
              <span className="text-primary-700">Bs {Math.round(cartTotal)}</span>
            </div>
          </div>
          
          <Button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            variant="primary"
            size="xl"
            className="w-full"
          >
            <ShoppingCart className="w-6 h-6 mr-2" />
            Cobrar
          </Button>
        </div>
      </div>
      
      {/* Modal de Pago */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Procesar Pago"
        size="md"
      >
        <div className="space-y-6">
          {/* Resumen de items para la nota de venta */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de Venta</h3>
            <div className="space-y-2">
              {cartItems.map((item) => {
                const isVacuumPacked = item.product.inventoryType === 'VACUUM_PACKED' && item.batchId;
                const actualWeight = item.actualWeight || item.qty;
                const pricePerKg = isVacuumPacked && item.actualWeight ? (item.unitPrice / item.actualWeight) : item.unitPrice;
                const itemSubtotalBeforeDiscount = item.qty * item.unitPrice;
                const itemDiscount = item.discount || 0;
                
                return (
                  <div key={item.id} className="text-sm">
                    <div className="font-medium text-gray-900 mb-1">{item.product.name}</div>
                    <div className="flex justify-between text-gray-600">
                      <span>
                        {isVacuumPacked ? (
                          // Productos en lote: peso × precio/kg
                          `${actualWeight.toFixed(3)} kg × Bs ${pricePerKg.toFixed(2)}/kg`
                        ) : item.product.saleType === 'WEIGHT' ? (
                          // Productos por peso: peso × precio/kg
                          `${item.qty.toFixed(3)} kg × Bs ${item.unitPrice.toFixed(2)}/kg`
                        ) : (
                          // Productos por unidad: qty × precio
                          `${item.qty} unid × Bs ${item.unitPrice.toFixed(2)}`
                        )}
                      </span>
                      <span className="font-semibold">Bs {itemSubtotalBeforeDiscount.toFixed(2)}</span>
                    </div>
                    {itemDiscount > 0 && (
                      <div className="flex justify-between text-xs text-red-600 mt-1 ml-2">
                        <span>Descuento</span>
                        <span>-Bs {itemDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Descuento Global (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descuento Adicional <span className="text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                Bs
              </span>
              <input
                type="number"
                value={globalDiscount.toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setGlobalDiscount(value);
                }}
                step="0.01"
                min="0"
                max={getCartSubtotal()}
                className="w-full pl-12 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Máximo: Bs {getCartSubtotal().toFixed(2)}
            </p>
          </div>
          
          {/* Resumen de totales */}
          <div className="space-y-2 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                Bs {getCartSubtotal().toFixed(2)}
              </span>
            </div>
            {cartItems.some(item => item.discount > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desc. en items</span>
                <span className="font-semibold text-red-600">
                  -Bs {cartItems.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}
                </span>
              </div>
            )}
            {globalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desc. adicional</span>
                <span className="font-semibold text-red-600">
                  -Bs {globalDiscount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-700">Total a Cobrar</span>
                <span className="text-2xl font-bold text-primary-700">
                  Bs {cartTotal}
                </span>
              </div>
            </div>
          </div>
          
          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Transferencia
              </button>
            </div>
          </div>
          
          {/* Pago en Efectivo */}
          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efectivo Recibido
              </label>
              <input
                type="number"
                value={cashPaid}
                onChange={(e) => setCashPaid(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              
              {change >= 0 && cashPaidNum > 0 && (
                <div className="mt-4 bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Cambio</p>
                  <p className="text-3xl font-bold text-green-700">
                    Bs {change}
                  </p>
                </div>
              )}
              
              {change < 0 && cashPaidNum > 0 && (
                <div className="mt-4 bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    Efectivo insuficiente. Faltan Bs {Math.abs(change)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Botones de Acción */}
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={!canCompleteSale}
              variant="success"
              size="lg"
              className="flex-1"
            >
              Confirmar Venta
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal de Éxito - MISMO PATRÓN QUE SaleDetailModal DE REPORTES */}
      {showSuccessModal && lastSale && (() => {
        console.log('🎭 [POS] Success modal RENDERING with sale:', lastSale.id.slice(-8));
        return true;
      })() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 no-print">
              <h2 className="text-xl font-bold text-gray-900">¡Venta Exitosa!</h2>
              <button
                onClick={handleNewSale}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Contenido visual (NO se imprime) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 no-print">
              {/* Icono de éxito */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  Bs {lastSale.total.toFixed(2)}
                </p>
                {lastSale.changeAmount > 0 && (
                  <p className="text-lg text-gray-600">
                    Cambio: Bs {lastSale.changeAmount.toFixed(2)}
                  </p>
                )}
              </div>
              
              {/* Info de la venta */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Ticket</p>
                    <p className="font-bold text-lg text-gray-900">#{lastSale.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha y Hora</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(lastSale.createdAt).toLocaleDateString('es-BO')}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(lastSale.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Método de Pago</p>
                    <p className="font-semibold text-gray-900">
                      {lastSale.paymentMethod === 'CASH' ? 'Efectivo' : lastSale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Tarjeta'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cajero</p>
                    <p className="font-semibold text-gray-900">{getUserDisplayName()}</p>
                  </div>
                </div>
              </div>
              
              {/* Productos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Productos ({lastSale.items.length})</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lastSale.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                            {item.batchNumber && (
                              <p className="text-xs text-gray-500">Lote: {item.batchNumber}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-sm text-gray-600">
                            {item.actualWeight 
                              ? `${Number(item.actualWeight).toFixed(2)} kg`
                              : `${item.qty} ${item.unit}`}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 text-sm">
                            Bs {item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Totales */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>Bs {lastSale.subtotal.toFixed(2)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Descuento:</span>
                    <span>-Bs {lastSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                  <span>TOTAL:</span>
                  <span className="text-primary-600">Bs {lastSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Botones de acción (no se imprimen) */}
            <div className="flex space-x-3 px-6 py-4 border-t border-gray-200 no-print">
              <Button 
                onClick={handlePrintReceipt} 
                variant="primary" 
                size="lg" 
                className="flex-1 flex items-center justify-center"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleNewSale} variant="outline" size="lg" className="flex-1">
                Nueva Venta
              </Button>
            </div>
          </div>
          
          {/* RECIBO PARA IMPRESIÓN - EN div.hidden IGUAL QUE SaleDetailModal */}
          <div className="hidden">
            <PrintableSaleReceipt
              printable={true}
              data={{
                saleId: lastSale.id,
                date: new Date(lastSale.createdAt).toLocaleDateString('es-BO', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }),
                time: new Date(lastSale.createdAt).toLocaleTimeString('es-BO', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                cashier: getUserDisplayName(),
                items: lastSale.items.map((item: any) => ({
                  name: item.productName,
                  quantity: item.qty,
                  unit: item.unit,
                  price: item.unitPrice,
                  subtotal: item.total,
                  discount: item.discount || 0,
                  batchNumber: item.batchNumber,
                  actualWeight: item.actualWeight,
                })),
                subtotal: lastSale.subtotal,
                discount: lastSale.discount || 0,
                total: lastSale.total,
                paymentMethod: lastSale.paymentMethod,
                cashPaid: lastSale.cashAmount || undefined,
                change: lastSale.changeAmount || undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Selección de Lotes */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setSelectedProductForBatch(null);
          setAvailableBatches([]);
          setShowManualBatchForm(false);
          setManualBatchData({ weight: '', price: '' });
        }}
        title={`Seleccionar Lote - ${selectedProductForBatch?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {loadingBatches ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando lotes disponibles...</p>
            </div>
          ) : (
            <>
              {/* Botón para agregar lote no registrado */}
              {!showManualBatchForm && (
                <button
                  onClick={() => setShowManualBatchForm(true)}
                  className="w-full p-3 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-yellow-800 font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  ⚠️ Agregar lote no registrado
                </button>
              )}
              
              {/* Formulario manual de lote */}
              {showManualBatchForm && (
                <div className="p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-900">⚠️ Lote no registrado</h4>
                    <button
                      onClick={() => {
                        setShowManualBatchForm(false);
                        setManualBatchData({ weight: '', price: '' });
                      }}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-yellow-800 mb-3">
                    Este lote se registrará automáticamente al completar la venta
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-yellow-900 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={manualBatchData.weight}
                        onChange={(e) => setManualBatchData({ ...manualBatchData, weight: e.target.value })}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="0.000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-900 mb-1">
                        Precio Total (Bs)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={manualBatchData.price}
                        onChange={(e) => setManualBatchData({ ...manualBatchData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddManualBatch}
                    variant="primary"
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    Agregar al carrito
                  </Button>
                </div>
              )}
              
              {/* Lista de lotes disponibles */}
              {availableBatches.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No hay lotes registrados</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Lotes disponibles en inventario:
                  </p>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {availableBatches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => handleSelectBatch(batch)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {batch.batchNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Empacado: {new Date(batch.packedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          Bs {Number(batch.unitPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Weight className="w-4 h-4 mr-1" />
                        {Number(batch.actualWeight).toFixed(3)} kg
                      </div>
                      {batch.expiryDate && (
                        <div className="text-gray-500">
                          Vence: {new Date(batch.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
                </>
              )}
            </>
          )}
        </div>
      </Modal>
      
      {/* Modal de descuento por item */}
      {showDiscountModal && selectedItemForDiscount && (
        <ItemDiscountModal
          item={selectedItemForDiscount}
          onClose={() => {
            setShowDiscountModal(false);
            setSelectedItemForDiscount(null);
          }}
          onApply={handleApplyDiscount}
          onApplyUnitPrice={handleApplyUnitPrice}
        />
      )}
    </div>
  );
};
