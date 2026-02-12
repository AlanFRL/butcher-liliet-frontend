import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui';
import { useProductStore, useCartStore, useCashStore, useSalesStore, useAuthStore } from '../store';
import { PrintableSaleReceipt } from '../components/PrintableSaleReceipt';
import { ItemDiscountModal } from '../components/ItemDiscountModal';
import { POSProductList } from '../components/pos/POSProductList';
import { POSCart } from '../components/pos/POSCart';
import { POSPaymentModal } from '../components/pos/POSPaymentModal';
import { useScanner } from '../hooks/useScanner';
import { customersApi, type CustomerResponse } from '../services/api';
import type { Product, CartItem } from '../types';
import { X } from 'lucide-react';

export const POSPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('CASH');
  const [cashPaid, setCashPaid] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [qtyInputs, setQtyInputs] = useState<{ [key: string]: string }>({});
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSession } = useCashStore();
  const { currentUser } = useAuthStore();
  const { products, categories, getFavoriteProducts, toggleProductFavorite } = useProductStore();
  const cartStore = useCartStore();
  const { cartItems, addToCart, updateCartItem, removeFromCart, clearCart, getCartTotal, getCartSubtotal, getItemDiscountsTotal, setItemUnitPrice, globalDiscount, setGlobalDiscount, orderCustomerId } = cartStore;
  const { completeSale } = useSalesStore();
  
  const orderId = location.state?.orderId as string | undefined;
  
  // Scanner hook
  const { scannerFeedback } = useScanner({
    isActive: !showPaymentModal && !showSuccessModal && !showDiscountModal
  });
  
  // Cargar customer del pedido (del store, persiste después de refresh)
  useEffect(() => {
    const loadOrderCustomer = async () => {
      if (orderCustomerId) {
        console.log('📦 Loading customer from cart store:', orderCustomerId);
        try {
          const customer = await customersApi.getById(orderCustomerId);
          setSelectedCustomer(customer);
          console.log('✅ Customer loaded:', customer.company || customer.name);
        } catch (error) {
          console.error('❌ Error loading customer:', error);
        }
      } else {
        // Si orderCustomerId es null, limpiar el cliente seleccionado
        console.log('🧹 Clearing selected customer (orderCustomerId is null)');
        setSelectedCustomer(null);
      }
    };
    
    loadOrderCustomer();
  }, [orderCustomerId]);
  
  // Verificar si hay caja abierta
  if (!currentSession || currentSession.status !== 'OPEN') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-900 mb-2">No hay caja abierta</h2>
          <p className="text-red-700 mb-4">
            Debes abrir una caja antes de realizar ventas.
          </p>
          <Button onClick={() => navigate('/cash')} variant="primary">
            Ir a Gestión de Caja
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
      const term = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    }
    return true;
  });
  
  const favoriteProducts = getFavoriteProducts();
  
  const handleAddToCart = async (product: Product) => {
    // VACUUM_PACKED y WEIGHT se tratan igual - no requieren lógica especial
    
    if (product.saleType === 'UNIT') {
      const currentInCart = cartItems.find(item => item.productId === product.id)?.qty || 0;
      const availableStock = product.stockUnits !== undefined ? product.stockUnits - currentInCart : Infinity;
      if (availableStock <= 0) {
        alert('No hay stock disponible de este producto');
        return;
      }
    }
    
    const defaultQty = product.saleType === 'WEIGHT' ? 1 : 1;
    addToCart(product, defaultQty);
  };

  const getInputValue = (itemId: string, qty: number, saleType: 'UNIT' | 'WEIGHT') => {
    if (qtyInputs[itemId] !== undefined) {
      return qtyInputs[itemId];
    }
    return saleType === 'WEIGHT' ? qty.toFixed(3) : qty.toString();
  };
  
  const handleQtyInputChange = (itemId: string, value: string) => {
    setQtyInputs(prev => ({ ...prev, [itemId]: value }));
  };
  
  const handleQtyInputBlur = (itemId: string, saleType: 'UNIT' | 'WEIGHT') => {
    const inputValue = qtyInputs[itemId] || '';
    const normalizedValue = inputValue.replace(',', '.');
    
    let finalQty: number;
    
    if (saleType === 'UNIT') {
      const parsed = parseInt(normalizedValue);
      if (isNaN(parsed) || parsed < 1) {
        finalQty = 1;
      } else {
        finalQty = parsed;
      }
    } else {
      const parsed = parseFloat(normalizedValue);
      if (isNaN(parsed) || parsed <= 0) {
        finalQty = 0.5;
      } else {
        finalQty = Math.max(0.001, parsed);
      }
    }
    
    updateCartItem(itemId, finalQty);
    setQtyInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[itemId];
      return newInputs;
    });
  };
  
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    const hasInvalidItems = cartItems.some(item => item.qty <= 0);
    if (hasInvalidItems) {
      alert('Hay items con cantidad inválida');
      return;
    }
    
    if (paymentMethod === 'CASH') {
      setCashPaid(Math.round(getCartTotal()).toString());
    }
    
    setShowPaymentModal(true);
  };
  
  const handleCompleteSale = async () => {
    if (isProcessingSale) return; // Prevenir doble click
    
    setIsProcessingSale(true);
    try {
      const sale = await completeSale(
        paymentMethod,
        paymentMethod === 'CASH' ? Math.round(parseFloat(cashPaid)) : undefined,
        orderId,
        selectedCustomer?.id
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
      
        if (orderId) {
          setTimeout(() => {
            setShowSuccessModal(false);
            navigate('/orders', { replace: true });
          }, 2000);
        }
      }
    } finally {
      setIsProcessingSale(false);
    }
  };
  
  const handleNewSale = () => {
    setShowSuccessModal(false);
    setLastSale(null);
    
    if (orderId) {
      navigate('/orders', { replace: true });
    }
  };
  
  const handlePrintReceipt = () => {
    console.log('🖨️ [POS] handlePrintReceipt called - IFRAME METHOD');
    
    const receipt = document.querySelector('.thermal-receipt-sale[data-printable="true"]');
    if (!receipt) {
      console.error('❌ Recibo no encontrado');
      return;
    }
    
    const receiptHTML = receipt.outerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none; left: -9999px;';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.error('❌ No se pudo acceder al documento del iframe');
      return;
    }
    
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo</title>
        <style>
          @page { size: 70mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 70mm; margin: 0; padding: 0; background: #fff; }
          .thermal-receipt-sale { width: 70mm; max-width: 70mm; margin: 0; padding: 0; background: #fff; }
          .thermal-receipt-sale__inner { width: 100%; padding: 2mm; font-family: "Courier New", monospace; font-size: 10pt; line-height: 1.3; font-weight: 600; color: #000; }
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
      <body>${receiptHTML}</body>
      </html>
    `);
    iframeDoc.close();
    
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    
    iframe.onload = () => setTimeout(doPrint, 100);
    setTimeout(() => { if (!printed) doPrint(); }, 500);
  };
  
  const getUserDisplayName = () => {
    if (!currentUser) return '';
    return currentUser.fullName || currentUser.username;
  };
  
  const handleOpenDiscountModal = (item: CartItem) => {
    setSelectedItemForDiscount(item);
    setShowDiscountModal(true);
  };
  
  const handleApplyUnitPrice = (newUnitPrice: number) => {
    if (selectedItemForDiscount) {
      setItemUnitPrice(selectedItemForDiscount.id, newUnitPrice);
    }
  };
  
  const cartTotal = Math.round(getCartTotal());
  const cashPaidNum = Math.round(parseFloat(cashPaid) || 0);
  const change = cashPaidNum - cartTotal;
  const canCompleteSale = paymentMethod === 'CASH' ? cashPaidNum >= cartTotal : true;
  
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
      
      {/* Panel Izqu ierdo: Productos */}
      <POSProductList
        products={filteredProducts}
        categories={categories}
        favoriteProducts={favoriteProducts}
        cartItems={cartItems}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        orderId={orderId}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onAddToCart={handleAddToCart}
        onToggleFavorite={toggleProductFavorite}
      />
      
      {/* Panel Derecho: Carrito */}
      <POSCart
        cartItems={cartItems}
        cartTotal={cartTotal}
        cartSubtotal={Math.round(getCartSubtotal())}
        itemDiscountsTotal={Math.round(getItemDiscountsTotal())}
        selectedCustomer={selectedCustomer}
        onSelectedCustomerChange={setSelectedCustomer}
        onClearCart={clearCart}
        onRemoveItem={removeFromCart}
        onUpdateItemQty={updateCartItem}
        onQtyInputChange={handleQtyInputChange}
        onQtyInputBlur={handleQtyInputBlur}
        onOpenDiscountModal={handleOpenDiscountModal}
        onCheckout={handleCheckout}
        getInputValue={getInputValue}
      />
      
      {/* Modal de Pago */}
      <POSPaymentModal
        isOpen={showPaymentModal}
        cartItems={cartItems}
        cartTotal={cartTotal}
        cartSubtotal={Math.round(getCartSubtotal())}
        itemDiscountsTotal={Math.round(getItemDiscountsTotal())}
        globalDiscount={globalDiscount}
        paymentMethod={paymentMethod}
        cashPaid={cashPaid}
        change={change}
        cashPaidNum={cashPaidNum}
        canCompleteSale={canCompleteSale}
        isProcessing={isProcessingSale}
        onClose={() => setShowPaymentModal(false)}
        onSetGlobalDiscount={setGlobalDiscount}
        onSetPaymentMethod={setPaymentMethod}
        onSetCashPaid={setCashPaid}
        onConfirm={handleCompleteSale}
      />
      
      {/* Modal de Éxito */}
      {showSuccessModal && lastSale && (() => {
        console.log('🎭 [POS] Success modal RENDERING with sale:', lastSale.id.slice(-8));
        return true;
      })() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 no-print">
              <h2 className="text-xl font-bold text-gray-900">¡Venta Exitosa!</h2>
              <button
                onClick={handleNewSale}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
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
                    price: item.unitPrice, // Ya contiene el precio efectivo desde completeSale
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
            
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 no-print">
              <Button
                onClick={handlePrintReceipt}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                🖨️ Imprimir
              </Button>
              <Button
                onClick={handleNewSale}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Descuento */}
      {showDiscountModal && selectedItemForDiscount && (
        <ItemDiscountModal
          item={selectedItemForDiscount}
          onClose={() => {
            setShowDiscountModal(false);
            setSelectedItemForDiscount(null);
          }}
          onApplyUnitPrice={handleApplyUnitPrice}
        />
      )}
    </div>
  );
};
