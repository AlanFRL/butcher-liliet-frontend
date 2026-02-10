import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Product,
  ProductCategory,
  CashSession,
  CashMovement,
  Sale,
  SaleStatus,
  SaleType,
  PaymentMethod,
  Terminal,
  CartItem,
  Order,
  Customer,
  OrderStatus,
} from '../types';
import { mockProducts, mockCategories, mockTerminals } from '../data/mockData';
import * as storage from '../utils/localStorage';

// API imports
import {
  authApi,
  tokenManager,
  cashSessionsApi,
  terminalsApi,
  productsApi,
  categoriesApi,
  salesApi,
  ordersApi,
  parseDecimal,
  ApiError,
} from '../services/api';

// ============= INTERFACES DEL STORE =============

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  loadUserFromToken: () => Promise<void>;
}

interface CashState {
  currentSession: CashSession | null;
  cashMovements: CashMovement[];
  isLoading: boolean;
  error: string | null;
  openCashSession: (terminalId: string, openingAmount: number, note?: string) => Promise<boolean>;
  closeCashSession: (countedCash: number, note?: string) => Promise<boolean>;
  addCashMovement: (type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT', amount: number, reason: string) => Promise<boolean>;
  loadCurrentSession: () => Promise<void>;
  loadCashMovements: (sessionId: string) => Promise<void>;
  clearSession: () => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
}

interface ProductState {
  products: Product[];
  categories: ProductCategory[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  toggleProductActive: (id: string) => void;
  toggleProductFavorite: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  getFavoriteProducts: () => Product[];
  loadProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
}

interface CartState {
  cartItems: CartItem[];
  globalDiscount: number; // Descuento adicional sobre el subtotal
  addToCart: (product: Product, qty: number, scannedData?: { barcode: string; subtotal: number }) => void;
  updateCartItem: (itemId: string, qty: number) => void;
  setItemDiscount: (itemId: string, discount: number) => void;
  setItemUnitPrice: (itemId: string, newUnitPrice: number) => void; // Cambiar precio/kg
  setGlobalDiscount: (discount: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  loadOrderToCart: (order: Order) => void; // Pre-cargar items de un pedido
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getItemDiscountsTotal: () => number;
}

interface SalesState {
  sales: Sale[];
  saleCounter: number;
  completeSale: (paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED', cashPaid?: number, orderId?: string, customerId?: string) => Promise<Sale | null>;
  getSalesByDateRange: (from: string, to: string) => Sale[];
  getTodaysSales: () => Sale[];
  deleteSale: (saleId: string) => Promise<boolean>;
}

interface AppState {
  terminals: Terminal[];
  currentTerminal: Terminal | null;
  setCurrentTerminal: (terminal: Terminal) => void;
  loadTerminals: () => Promise<void>;
}

// ============= STORE DE AUTENTICACIÓN =============

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true, // Iniciar en true para verificar token al cargar
  error: null,
  
  login: async (username: string, pin: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('🔐 Login attempt for user:', username);
      
      // 1. Llamar al endpoint de login
      const response = await authApi.login(username, pin);
      console.log('✅ Login response received');
      
      // 2. Guardar el token
      tokenManager.setToken(response.access_token);
      console.log('✅ Token saved to localStorage');
      
      // 3. Obtener información del usuario
      const userResponse = await authApi.me();
      console.log('✅ User info loaded:', userResponse.username);
      
      // 4. Convertir UserResponse a User (adaptación de tipos)
      const user: User = {
        id: userResponse.id,
        username: userResponse.username,
        fullName: userResponse.fullName,
        role: userResponse.role,
        pin: '', // No guardamos el PIN en el frontend
        isActive: userResponse.isActive,
      };
      
      set({ 
        currentUser: user, 
        isAuthenticated: true,
        isLoading: false,
        error: null 
      });
      
      // 5. Cargar datos desde el backend
      await useAppStore.getState().loadTerminals();
      await useProductStore.getState().loadCategories();
      await useProductStore.getState().loadProducts();
      
      console.log('✅ Login completed successfully');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error de conexión';
      
      set({ 
        currentUser: null, 
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage 
      });
      
      return false;
    }
  },
  
  logout: () => {
    tokenManager.removeToken();
    set({ 
      currentUser: null, 
      isAuthenticated: false,
      error: null 
    });
  },
  
  loadUserFromToken: async () => {
    // Intentar cargar usuario si hay token guardado
    const hasToken = tokenManager.hasToken();
    console.log('🔐 loadUserFromToken - Has token:', hasToken);
    
    if (!hasToken) {
      console.log('🔐 No token found, skipping auto-login');
      set({ isLoading: false });
      return;
    }
    
    set({ isLoading: true });
    
    try {
      console.log('🔐 Attempting to load user from token...');
      const userResponse = await authApi.me();
      
      const user: User = {
        id: userResponse.id,
        username: userResponse.username,
        fullName: userResponse.fullName,
        role: userResponse.role,
        pin: '',
        isActive: userResponse.isActive,
      };
      
      console.log('✅ User loaded successfully:', user.username);
      
      set({ 
        currentUser: user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Cargar datos desde el backend
      await useAppStore.getState().loadTerminals();
      await useProductStore.getState().loadCategories();
      await useProductStore.getState().loadProducts();
    } catch (error) {
      // Token inválido o expirado
      console.error('❌ Failed to load user from token:', error);
      tokenManager.removeToken();
      set({ 
        currentUser: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },
}));

// ============= STORE DE CAJA =============

export const useCashStore = create<CashState>((set, get) => ({
  currentSession: null,
  cashMovements: [],
  isLoading: false,
  error: null,
  
  openCashSession: async (terminalId: string, openingAmount: number, note = ''): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      // Llamar al backend para abrir sesión
      const response = await cashSessionsApi.open({
        terminalId,
        openingAmount,
        openingNotes: note || undefined,
      });
      
      // Convertir respuesta del backend a CashSession local
      const session: CashSession = {
        id: response.id,
        terminalId: response.terminalId,
        userId: response.userId,
        status: response.status,
        openedAt: response.openedAt,
        openingAmount: parseDecimal(response.openingAmount),
        openingNotes: response.openingNotes,
        closedAt: response.closedAt,
        closingNotes: response.closingNotes,
        expectedAmount: response.expectedAmount ? parseDecimal(response.expectedAmount) : null,
        closingAmount: response.closingAmount ? parseDecimal(response.closingAmount) : null,
        differenceAmount: response.differenceAmount ? parseDecimal(response.differenceAmount) : null,
      };
      
      set({ 
        currentSession: session, 
        cashMovements: [],
        isLoading: false,
        error: null 
      });
      
      return true;
    } catch (error) {
      console.error('Error opening cash session:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al abrir sesión de caja';
      
      set({ 
        isLoading: false,
        error: errorMessage 
      });
      
      return false;
    }
  },
  
  closeCashSession: async (countedCash: number, note = ''): Promise<boolean> => {
    const { currentSession } = get();
    if (!currentSession) {
      set({ error: 'No hay sesión abierta' });
      return false;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Llamar al backend para cerrar sesión
      const response = await cashSessionsApi.close(currentSession.id, {
        closingAmount: countedCash,
        closingNotes: note || undefined,
      });
      
      // Convertir respuesta a CashSession local
      const closedSession: CashSession = {
        id: response.id,
        terminalId: response.terminalId,
        userId: response.userId,
        status: response.status,
        openedAt: response.openedAt,
        openingAmount: parseDecimal(response.openingAmount),
        openingNotes: response.openingNotes,
        closedAt: response.closedAt,
        closingNotes: response.closingNotes,
        expectedAmount: response.expectedAmount ? parseDecimal(response.expectedAmount) : null,
        closingAmount: response.closingAmount ? parseDecimal(response.closingAmount) : null,
        differenceAmount: response.differenceAmount ? parseDecimal(response.differenceAmount) : null,
      };
      
      set({ 
        currentSession: closedSession,
        isLoading: false,
        error: null 
      });
      
      return true;
    } catch (error) {
      console.error('Error closing cash session:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al cerrar sesión de caja';
      
      set({ 
        isLoading: false,
        error: errorMessage 
      });
      
      return false;
    }
  },
  
  addCashMovement: async (type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT', amount: number, reason: string): Promise<boolean> => {
    const { currentSession, cashMovements } = get();
    if (!currentSession) {
      set({ error: 'No hay sesión abierta' });
      return false;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Llamar al backend para agregar movimiento
      const response = await cashSessionsApi.addMovement(currentSession.id, {
        type,
        amount,
        reason,
      });
      
      // Agregar movimiento a la lista local
      const newMovement: CashMovement = {
        id: response.id,
        cashSessionId: response.sessionId,
        type: response.type,
        amount: parseDecimal(response.amount),
        reason: response.reason,
        createdBy: response.createdBy,
        createdAt: response.createdAt,
      };
      
      // Actualizar expectedAmount de la sesión
      let updatedSession = currentSession;
      if (currentSession.expectedAmount !== null) {
        const movementAmount = parseDecimal(response.amount);
        if (type === 'DEPOSIT') {
          updatedSession = {
            ...currentSession,
            expectedAmount: currentSession.expectedAmount + movementAmount,
          };
        } else if (type === 'WITHDRAWAL') {
          updatedSession = {
            ...currentSession,
            expectedAmount: currentSession.expectedAmount - movementAmount,
          };
        }
      }
      
      set({ 
        currentSession: updatedSession,
        cashMovements: [...cashMovements, newMovement],
        isLoading: false,
        error: null 
      });
      
      return true;
    } catch (error) {
      console.error('Error adding cash movement:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al agregar movimiento de caja';
      
      set({ 
        isLoading: false,
        error: errorMessage 
      });
      
      return false;
    }
  },
  
  loadCurrentSession: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Obtener sesión actual del usuario autenticado
      const response = await cashSessionsApi.getMySession();
      
      if (response) {
        const session: CashSession = {
          id: response.id,
          terminalId: response.terminalId,
          userId: response.userId,
          status: response.status,
          openedAt: response.openedAt,
          openingAmount: parseDecimal(response.openingAmount),
          openingNotes: response.openingNotes,
          closedAt: response.closedAt,
          closingNotes: response.closingNotes,
          expectedAmount: response.expectedAmount ? parseDecimal(response.expectedAmount) : null,
          closingAmount: response.closingAmount ? parseDecimal(response.closingAmount) : null,
          differenceAmount: response.differenceAmount ? parseDecimal(response.differenceAmount) : null,
          user: response.user ? {
            id: response.user.id,
            fullName: response.user.fullName,
          } : undefined,
          closedBy: response.closedBy ? {
            id: response.closedBy.id,
            fullName: response.closedBy.fullName,
          } : undefined,
        };
        
        set({ 
          currentSession: session,
          isLoading: false 
        });
        
        // Cargar movimientos de la sesión
        try {
          const movements = await cashSessionsApi.getMovements(session.id);
          const cashMovements: CashMovement[] = movements.map((m: any) => ({
            id: m.id,
            cashSessionId: m.sessionId,
            type: m.type,
            amount: parseDecimal(m.amount),
            reason: m.reason,
            createdBy: m.createdBy,
            createdAt: m.createdAt,
          }));
          set({ cashMovements });
        } catch (error) {
          console.error('Error loading cash movements:', error);
          set({ cashMovements: [] });
        }
      } else {
        set({ 
          currentSession: null,
          cashMovements: [],
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error loading current session:', error);
      set({ 
        currentSession: null,
        cashMovements: [],
        isLoading: false 
      });
    }
  },
  
  loadCashMovements: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const movements = await cashSessionsApi.getMovements(sessionId);
      const cashMovements: CashMovement[] = movements.map((m: any) => ({
        id: m.id,
        cashSessionId: m.sessionId,
        type: m.type,
        amount: parseDecimal(m.amount),
        reason: m.reason,
        createdBy: m.createdBy,
        createdAt: m.createdAt,
      }));
      
      set({ 
        cashMovements,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading cash movements:', error);
      set({ 
        cashMovements: [],
        isLoading: false,
        error: 'Error al cargar movimientos' 
      });
    }
  },
  
  clearSession: () => {
    set({ 
      currentSession: null, 
      cashMovements: [],
      error: null 
    });
  },

  deleteSession: async (sessionId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('⚠️ Deleting session:', sessionId);
      
      await cashSessionsApi.delete(sessionId);
      
      console.log('✅ Session deleted successfully');
      
      set({ 
        isLoading: false,
        error: null 
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al eliminar sesión de caja';
      
      set({ 
        isLoading: false,
        error: errorMessage 
      });
      
      return false;
    }
  },
}));

// ============= STORE DE PRODUCTOS =============

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  
  addProduct: async (product) => {
    set({ isLoading: true, error: null });
    
    try {
      // Validar que barcode sea requerido solo si no es NONE
      if (product.barcodeType !== 'NONE' && (!product.barcode || !product.barcodeType)) {
        throw new Error('El código de barras y su tipo son obligatorios');
      }
      
      // Crear producto en el backend (SKU será auto-generado)
      const productData = {
        name: product.name,
        barcode: product.barcodeType === 'NONE' ? null : (product.barcode || null),
        barcodeType: product.barcodeType,
        description: (product as any).description,
        categoryId: product.categoryId || '',
        saleType: product.saleType,
        inventoryType: product.saleType === 'WEIGHT' ? 'WEIGHT' as const : 'UNIT' as const,
        price: product.price,
        costPrice: 0,
        unit: product.unit,
        stockQuantity: (product as any).stockQuantity || 0,
        minStock: (product as any).minStock || 0,
      };
      
      await productsApi.create(productData);
      console.log('✅ Product created in backend');
      
      // Recargar lista de productos
      await get().loadProducts();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('❌ Error creating product:', error);
      set({ 
        isLoading: false,
        error: 'Error al crear producto'
      });
      throw error;
    }
  },
  
  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Preparar datos para el backend (SKU no puede actualizarse)
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
      if ((updates as any).barcodeType !== undefined) updateData.barcodeType = (updates as any).barcodeType;
      if ((updates as any).description !== undefined) updateData.description = (updates as any).description;
      if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
      if (updates.saleType !== undefined) updateData.saleType = updates.saleType;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if ((updates as any).stockQuantity !== undefined) updateData.stockQuantity = (updates as any).stockQuantity;
      if ((updates as any).minStock !== undefined) updateData.minStock = (updates as any).minStock;
      
      await productsApi.update(id, updateData);
      console.log('✅ Product updated in backend');
      
      // Recargar lista de productos
      await get().loadProducts();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      set({ 
        isLoading: false,
        error: 'Error al actualizar producto'
      });
      throw error;
    }
  },
  
  toggleProductActive: (id) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ),
    }));
  },
  
  toggleProductFavorite: (id) => {
    set((state) => {
      const product = state.products.find(p => p.id === id);
      console.log('🌟 Toggle Favorite:', product?.name, 'Current:', product?.isFavorite, '→ New:', !product?.isFavorite);
      return {
        products: state.products.map((p) =>
          p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      };
    });
  },
  
  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },
  
  getProductsByCategory: (categoryId) => {
    return get().products.filter((p) => p.categoryId === categoryId && p.isActive);
  },
  
  getFavoriteProducts: () => {
    return get().products.filter((p) => p.isFavorite && p.isActive);
  },
  
  // Cargar productos desde el backend
  loadProducts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const productsResponse = await productsApi.getAll();
      
      // Convertir ProductResponse[] a Product[]
      const products: Product[] = productsResponse.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode || undefined,
        barcodeType: p.barcodeType,
        categoryId: p.categoryId || null,
        saleType: p.saleType,
        inventoryType: p.inventoryType, // CRITICAL: Include inventoryType from backend
        unit: p.unit || 'kg',
        price: parseDecimal(p.price),
        taxRate: 0, // No está en backend todavía
        isActive: p.isActive,
        isFavorite: false, // Se puede agregar al backend más adelante
        stockUnits: parseDecimal(p.stockQuantity),
        minStockAlert: parseDecimal(p.minStock),
      }));
      
      console.log('✅ Products loaded from backend:', products.length);
      set({ products, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading products:', error);
      // Fallback a mock data si falla
      set({ 
        products: mockProducts,
        isLoading: false,
        error: 'Error al cargar productos, usando datos de demostración'
      });
    }
  },
  
  // Cargar categorías desde el backend
  loadCategories: async () => {
    try {
      const categoriesResponse = await categoriesApi.getAll();
      
      // Convertir a ProductCategory[]
      const categories: ProductCategory[] = categoriesResponse.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        isActive: c.isActive,
      }));
      
      console.log('✅ Categories loaded from backend:', categories.length);
      set({ categories });
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Fallback a mock data si falla
      set({ categories: mockCategories });
    }
  },
}));

// ============= STORE DE CARRITO =============

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  globalDiscount: 0,
  
  addToCart: (product, qty, scannedData) => {
    const { cartItems } = get();
    
    // Para productos WEIGHT_EMBEDDED: siempre crear item nuevo (nunca sumar)
    if (product.barcodeType === 'WEIGHT_EMBEDDED') {
      const unitPrice = product.price; // Precio original del sistema
      const finalTotal = scannedData ? scannedData.subtotal : Math.round(qty * product.price);
      
      // Detectar descuento: comparar precio esperado con precio real
      const expectedTotal = Math.round(qty * unitPrice);
      const discount = expectedTotal - finalTotal;
      
      // Calcular precio efectivo por kg REDONDEADO (sin decimales)
      const effectivePricePerKg = qty > 0 ? Math.round(finalTotal / qty) : unitPrice;
      const priceDiscountPerKg = unitPrice - effectivePricePerKg;
      
      // Detectar descuento: si el precio por kg es diferente (tolerancia 1 Bs/kg)
      const hasDiscount = Math.abs(priceDiscountPerKg) >= 1;
      
      // Precio efectivo es un entero (sin decimales)
      const effectiveUnitPrice = hasDiscount ? effectivePricePerKg : unitPrice;
      
      const newItem: CartItem = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        saleType: product.saleType,
        unit: product.unit,
        qty,
        unitPrice, // Precio ORIGINAL del sistema
        originalUnitPrice: unitPrice,
        effectiveUnitPrice: hasDiscount ? effectiveUnitPrice : undefined, // Solo guardar si hay descuento
        discount: hasDiscount ? discount : 0,
        discountAutoDetected: hasDiscount,
        total: finalTotal, // Precio FINAL después del descuento
        product,
        scannedBarcode: scannedData?.barcode,
        scannedSubtotal: scannedData?.subtotal,
      };
      set({ cartItems: [...cartItems, newItem] });
      return;
    }
    
    // Para productos STANDARD: sumar cantidades si ya existe
    const existingItem = cartItems.find((item) => item.productId === product.id);
    
    if (existingItem) {
      // Actualizar cantidad
      set({
        cartItems: cartItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                qty: item.qty + qty,
                total: Math.round((item.qty + qty) * item.unitPrice),
              }
            : item
        ),
      });
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        saleType: product.saleType,
        unit: product.unit,
        qty,
        unitPrice: product.price,
        originalUnitPrice: product.price,
        discount: 0,
        total: Math.round(qty * product.price),
        product,
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },
  
  updateCartItem: (itemId, qty) => {
    // Permitir 0 temporalmente (mientras escribe), pero no negativos
    if (qty < 0) {
      return;
    }
    
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.id !== itemId) return item;
        
        // Si existe effectiveUnitPrice, usarlo para mantener el precio con descuento
        // Si no, usar el unitPrice original (sin descuento)
        const priceToUse = item.effectiveUnitPrice || item.unitPrice;
        
        // Calcular nuevo subtotal y total
        const newSubtotal = Math.round(qty * item.unitPrice);
        const newTotalRaw = qty * priceToUse;
        const newTotal = Math.round(newTotalRaw);
        const newDiscount = newSubtotal - newTotal; // Ya están redondeados, no redondear de nuevo
        
        return {
          ...item,
          qty,
          discount: newDiscount > 0 ? newDiscount : 0,
          total: newTotal,
        };
      }),
    }));
  },
  
  setItemDiscount: (itemId, discount) => {
    // Validar que el descuento no sea negativo
    if (discount < 0) {
      return;
    }
    
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.id === itemId) {
          // Calcular subtotal del item sin descuento
          const itemSubtotal = item.qty * item.unitPrice;
          
          // No permitir descuento mayor al subtotal
          const validDiscount = Math.min(discount, itemSubtotal);
          
          return {
            ...item,
            discount: validDiscount,
            total: Math.round(itemSubtotal - validDiscount),
          };
        }
        return item;
      }),
    }));
  },
  
  setItemUnitPrice: (itemId, newUnitPrice) => {
    // Validar que el precio sea positivo
    if (newUnitPrice <= 0) {
      return;
    }
    
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.id === itemId) {
          // unitPrice siempre es el precio ORIGINAL del sistema
          const originalUnitPrice = item.originalUnitPrice || item.product.price;
          
          // Calcular descuento y total
          const expectedTotal = Math.round(item.qty * originalUnitPrice);
          const newTotal = Math.round(item.qty * newUnitPrice);
          const discount = expectedTotal - newTotal;
          
          return {
            ...item,
            unitPrice: originalUnitPrice, // MANTENER precio original
            effectiveUnitPrice: newUnitPrice, // Guardar precio efectivo para cálculos proporcionales
            discount: discount > 0 ? discount : 0,
            total: newTotal, // Total con descuento aplicado
          };
        }
        return item;
      }),
    }));
  },
  
  setGlobalDiscount: (discount) => {
    // Validar que el descuento no sea negativo
    if (discount < 0) {
      return;
    }
    
    // Calcular subtotal total
    const subtotal = get().getCartSubtotal();
    
    // No permitir descuento mayor al subtotal
    const validDiscount = Math.min(discount, subtotal);
    
    set({ globalDiscount: validDiscount });
  },
  
  removeFromCart: (itemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }));
  },
  
  clearCart: () => {
    set({ cartItems: [], globalDiscount: 0 });
  },
  
  loadOrderToCart: (order) => {
    // Obtener productos para construir CartItems completos
    const productState = useProductStore.getState();
    
    const cartItems: CartItem[] = order.items.map((orderItem) => {
      const product = productState.products.find(p => p.id === orderItem.productId);
      
      // Si el producto ya no existe, crear uno temporal con los datos guardados
      const productData: Product = product ? {
        ...product,
      } : {
        id: orderItem.productId,
        categoryId: null,
        sku: orderItem.productSku,
        name: orderItem.productName,
        barcode: undefined, // No disponible en datos históricos
        barcodeType: 'NONE',
        saleType: orderItem.saleType,
        unit: orderItem.unit,
        price: orderItem.unitPrice,
        taxRate: 0,
        isActive: false, // Marcado como inactivo si ya no existe
        isFavorite: false,
      };
      
      const cartItem: CartItem = {
        id: uuidv4(), // Nuevo ID para el carrito
        productId: orderItem.productId,
        productName: orderItem.productName,
        saleType: orderItem.saleType,
        unit: orderItem.unit,
        qty: orderItem.qty,
        unitPrice: orderItem.unitPrice,
        discount: orderItem.discount || 0, // Cargar descuento del pedido
        total: Math.round(orderItem.qty * orderItem.unitPrice - (orderItem.discount || 0)),
        product: productData,
      };

      // Si hay descuento, calcular effectiveUnitPrice para mantenerlo al cambiar cantidad
      if (orderItem.discount && orderItem.discount > 0) {
        const subtotal = orderItem.qty * orderItem.unitPrice;
        cartItem.effectiveUnitPrice = (subtotal - orderItem.discount) / orderItem.qty;
      }

      return cartItem;
    });
    
    set({ 
      cartItems,
      globalDiscount: order.discount || 0 // Cargar descuento global del pedido
    });
  },
  
  getCartSubtotal: () => {
    // Suma de subtotales ANTES de descuentos por item (qty × unitPrice)
    return get().cartItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  },
  
  getItemDiscountsTotal: () => {
    // Suma de todos los descuentos por item
    return get().cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  },
  
  getCartTotal: () => {
    const subtotal = get().getCartSubtotal();
    const itemDiscounts = get().getItemDiscountsTotal();
    const globalDiscount = get().globalDiscount;
    // Total = Subtotal - Descuentos de Items - Descuento Global
    return Math.max(0, subtotal - itemDiscounts - globalDiscount);
  },
}));

// ============= STORE DE VENTAS =============

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: storage.getSales(),
  saleCounter: storage.getSaleCounter(),
  
  completeSale: async (paymentMethod, cashPaid, orderId, customerId) => {
    const cashState = useCashStore.getState();
    const cartState = useCartStore.getState();
    const authState = useAuthStore.getState();
    
    if (!cashState.currentSession || !authState.currentUser) {
      console.error('❌ No hay sesión de caja o usuario autenticado');
      return null;
    }
    
    if (cartState.cartItems.length === 0) {
      console.error('❌ El carrito está vacío');
      return null;
    }
    
    try {
      // PASO 1: Crear la venta
      const cartTotal = Math.round(cartState.getCartTotal());
      const cashPaidRounded = cashPaid ? Math.round(cashPaid) : 0;
      
      const saleData = {
        sessionId: cashState.currentSession.id,
        items: cartState.cartItems.map((item) => ({
          productId: item.productId,
          quantity: Math.round(item.qty * 1000) / 1000, // Redondear a 3 decimales para peso
          unitPrice: Math.round(item.unitPrice),
          discount: Math.round(item.discount || 0), // Redondear descuento
        })),
        discount: Math.round(cartState.globalDiscount || 0), // Redondear descuento global
        paymentMethod,
        cashAmount: paymentMethod === 'CASH' ? cashPaidRounded : undefined,
        cardAmount: paymentMethod === 'CARD' ? cartTotal : undefined,
        transferAmount: paymentMethod === 'TRANSFER' ? cartTotal : undefined,
        notes: undefined,
        customerId: customerId,
        orderId: orderId,
      };

      console.log('📤 Enviando venta al backend...', saleData);
      const backendSale = await salesApi.create(saleData);
      console.log('✅ Venta creada en backend:', backendSale);

      // Convertir respuesta del backend a formato local
      const localSale: Sale = {
        id: backendSale.id,
        cashSessionId: backendSale.sessionId,
        cashierId: backendSale.cashierId,
        status: backendSale.status as SaleStatus,
        items: (backendSale.items || []).map((item: any) => {
          const cartItem = cartState.cartItems.find(ci => ci.productId === item.productId);
          const product = useProductStore.getState().products.find(p => p.id === item.productId);
          return {
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            saleType: cartItem?.saleType || 'UNIT',
            qty: parseDecimal(item.quantity),
            unit: cartItem?.product.unit || product?.unit || 'unid',
            unitPrice: parseDecimal(item.unitPrice),
            discount: parseDecimal(item.discount),
            total: parseDecimal(item.subtotal),
            originalUnitPrice: product?.price, // Buscar directamente del store de productos
          };
        }),
        subtotal: parseDecimal(backendSale.subtotal),
        discount: parseDecimal(backendSale.discount),
        total: parseDecimal(backendSale.total),
        paymentMethod: backendSale.paymentMethod as PaymentMethod,
        cashAmount: backendSale.cashAmount ? parseDecimal(backendSale.cashAmount) : null,
        cardAmount: backendSale.cardAmount ? parseDecimal(backendSale.cardAmount) : null,
        transferAmount: backendSale.transferAmount ? parseDecimal(backendSale.transferAmount) : null,
        changeAmount: backendSale.changeAmount ? parseDecimal(backendSale.changeAmount) : null,
        notes: backendSale.notes,
        customerName: backendSale.customerName,
        orderId,
        createdAt: backendSale.createdAt,
      };

      // Agregar a estado local para mantener sincronizado
      set((state) => ({
        sales: [...state.sales, localSale],
        saleCounter: state.saleCounter + 1,
      }));

      // Persistir en localStorage
      const updatedState = get();
      storage.saveSales(updatedState.sales);
      storage.saveSaleCounter(updatedState.saleCounter);

      // Si viene de un pedido, recargar pedidos para reflejar el cambio
      // (el backend ya marcó el order como DELIVERED al crear la venta)
      if (orderId) {
        const orderState = useOrderStore.getState();
        orderState.loadOrders();
      }

      // Recargar productos para actualizar stock
      const productState = useProductStore.getState();
      productState.loadProducts();

      // Limpiar carrito
      cartState.clearCart();

      return localSale;
    } catch (error) {
      console.error('❌ Error al completar venta:', error);
      alert('Error al procesar la venta. Por favor intente nuevamente.');
      return null;
    }
  },
  
  getSalesByDateRange: (from, to) => {
    return get().sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= new Date(from) && saleDate <= new Date(to);
    });
  },
  
  getTodaysSales: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return get().sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= today && saleDate < tomorrow && s.status === 'COMPLETED';
    });
  },

  deleteSale: async (saleId: string): Promise<boolean> => {
    try {
      console.log('⚠️ Deleting sale:', saleId);
      
      await salesApi.delete(saleId);
      
      console.log('✅ Sale deleted successfully');
      
      // Actualizar estado local: eliminar la venta
      set((state) => ({
        sales: state.sales.filter(s => s.id !== saleId),
      }));
      
      // Persistir en localStorage
      const updatedState = get();
      storage.saveSales(updatedState.sales);
      
      // Recargar productos para actualizar stock restaurado
      const productState = useProductStore.getState();
      productState.loadProducts();
      
      // Recargar pedidos por si se limpió alguna referencia
      const orderState = useOrderStore.getState();
      orderState.loadOrders();
      
      // Recargar sesión actual si está abierta (para actualizar expectedAmount)
      const cashState = useCashStore.getState();
      if (cashState.currentSession) {
        cashState.loadCurrentSession();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting sale:', error);
      return false;
    }
  },
}));

// ============= STORE DE APP =============

export const useAppStore = create<AppState>((set, get) => ({
  terminals: [],
  currentTerminal: null,
  
  setCurrentTerminal: (terminal) => {
    set({ currentTerminal: terminal });
  },
  
  // Cargar terminales desde el backend
  loadTerminals: async () => {
    try {
      const terminals = await terminalsApi.getActive();
      set({ 
        terminals,
        // Si no hay terminal seleccionada, usar la primera
        currentTerminal: get().currentTerminal || terminals[0] || null
      });
    } catch (error) {
      console.error('Error loading terminals:', error);
      // Si falla, usar mock como fallback
      set({ 
        terminals: mockTerminals,
        currentTerminal: get().currentTerminal || mockTerminals[0]
      });
    }
  },
}));

// ============= STORE DE PEDIDOS =============

interface OrderState {
  orders: Order[];
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  loadOrders: () => Promise<void>;
  createOrder: (data: {
    customerId: string; // Add customerId
    customerName: string;
    customerPhone?: string;
    items: Array<{
      productId: string;
      batchId?: string;
      qty: number;
      discount?: number; // Descuento por item
      notes?: string;
    }>;
    discount?: number; // Descuento global
    deliveryDate: string;
    deliveryTime: string;
    notes?: string;
  }) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string, saleId?: string) => Promise<boolean>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<boolean>;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  markAsDelivered: (orderId: string) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPendingOrders: () => Order[];
  getOverdueOrders: () => Order[];
  getTodaysDeliveries: () => Order[];
  // Customers management (local for now)
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  searchCustomers: (query: string) => Customer[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  customers: storage.getCustomers(),
  isLoading: false,
  error: null,

  loadOrders: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await ordersApi.getAll();
      
      // Convert backend response to frontend Order format
      const orders: Order[] = response.map(order => ({
        id: order.id,
        orderNumber: parseInt(order.orderNumber.replace(/\D/g, '')),
        customerId: '', // No longer used
        customerName: order.customerName,
        customerPhone: order.customerPhone || '',
        status: order.status as OrderStatus,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime || '',
        items: order.items?.map(item => ({
          id: item.id,
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          saleType: 'UNIT' as SaleType,
          qty: parseDecimal(item.quantity),
          unit: item.unit,
          unitPrice: parseDecimal(item.unitPrice),
          total: parseDecimal(item.subtotal),
          discount: parseDecimal(item.discount || 0), // Cargar descuento del item
          notes: item.notes,
        })) || [],
        subtotal: parseDecimal(order.subtotal),
        discount: parseDecimal(order.discount),
        total: parseDecimal(order.total),
        notes: order.notes,
        createdBy: order.createdBy,
        saleId: order.saleId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        completedAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason,
      }));

      set({ orders, isLoading: false });
      console.log('✅ Orders loaded from backend:', orders.length);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      set({ error: 'Failed to load orders', isLoading: false });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentUser } = useAuthStore.getState();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Map frontend items to backend format
      // IMPORTANTE: Redondear valores igual que en POS para evitar decimales inconsistentes
      const backendItems = data.items.map(item => ({
        productId: item.productId,
        quantity: Math.round(item.qty * 1000) / 1000, // Redondear a 3 decimales para peso
        discount: Math.round(item.discount || 0), // Redondear descuento a entero
        notes: item.notes,
      }));

      const response = await ordersApi.create({
        customerId: data.customerId, // Add customer ID
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        items: backendItems,
        discount: Math.round(data.discount || 0), // Redondear descuento global a entero
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime,
        notes: data.notes,
      });

      // Convert to frontend format
      const newOrder: Order = {
        id: response.id,
        orderNumber: parseInt(response.orderNumber.replace(/\D/g, '')),
        customerId: data.customerId || '',
        customerName: response.customerName,
        customerPhone: response.customerPhone || '',
        status: response.status as OrderStatus,
        deliveryDate: response.deliveryDate,
        deliveryTime: response.deliveryTime || '',
        items: response.items?.map(item => ({
          id: item.id,
          orderId: response.id,
          productId: item.productId,
          batchId: item.batchId,
          productName: item.productName,
          productSku: item.productSku,
          saleType: 'UNIT' as SaleType,
          qty: parseDecimal(item.quantity),
          unit: item.unit,
          unitPrice: parseDecimal(item.unitPrice),
          total: parseDecimal(item.subtotal),
          discount: parseDecimal(item.discount || 0), // Cargar descuento del item
          notes: item.notes,
          batch: item.batch ? {
            id: item.batch.id,
            productId: item.productId,
            batchNumber: item.batch.batchNumber,
            actualWeight: parseDecimal(item.batch.actualWeight),
            unitCost: 0,
            unitPrice: parseDecimal(item.batch.unitPrice),
            isSold: item.batch.isSold,
            packedAt: new Date().toISOString(),
            expiryDate: null,
          } : undefined,
        })) || [],
        subtotal: parseDecimal(response.subtotal),
        discount: parseDecimal(response.discount),
        total: parseDecimal(response.total),
        notes: response.notes,
        createdBy: response.createdBy,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      set((state) => ({
        orders: [...state.orders, newOrder],
        isLoading: false,
      }));

      console.log('✅ Order created:', newOrder.id);
      return newOrder;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      set({ error: 'Failed to create order', isLoading: false });
      return null;
    }
  },

  updateOrderStatus: async (orderId, status, reason, saleId) => {
    set({ isLoading: true, error: null });
    
    try {
      let response;
      
      if (status === 'CANCELLED' && reason) {
        response = await ordersApi.cancel(orderId, reason);
      } else if (status === 'DELIVERED') {
        response = await ordersApi.markAsDelivered(orderId);
      } else if (status === 'READY') {
        response = await ordersApi.markAsReady(orderId);
      } else {
        // General update not supported - use specific status endpoints
        throw new Error('Use specific status methods: markAsReady, markAsDelivered, cancel');
      }

      // Update local state
      set((state) => ({
        orders: state.orders.map((order) => {
          if (order.id !== orderId) return order;

          return {
            ...order,
            status: response.status as OrderStatus,
            updatedAt: response.updatedAt,
            completedAt: response.deliveredAt,
            cancelledAt: response.cancelledAt,
            cancellationReason: response.cancellationReason,
            saleId: saleId || order.saleId,
          };
        }),
        isLoading: false,
      }));

      console.log(`✅ Order ${orderId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      set({ error: 'Failed to update order status', isLoading: false });
      return false;
    }
  },

  updateOrder: async (orderId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const updateData: any = {
        customerName: updates.customerName,
        customerPhone: updates.customerPhone,
        deliveryDate: updates.deliveryDate,
        deliveryTime: updates.deliveryTime,
        notes: updates.notes,
      };
      
      // Agregar descuento global si viene en updates (redondeado)
      if (updates.discount !== undefined) {
        updateData.discount = Math.round(updates.discount);
      }

      // Add items if provided
      // IMPORTANTE: Redondear valores igual que en POS para evitar decimales inconsistentes
      if (updates.items) {
        updateData.items = updates.items.map(item => ({
          productId: item.productId,
          quantity: Math.round(item.qty * 1000) / 1000, // Redondear a 3 decimales para peso
          discount: Math.round(item.discount || 0), // Redondear descuento a entero
          notes: item.notes,
        }));
      }

      const response = await ordersApi.update(orderId, updateData);

      // Update local state with full order data
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? response as unknown as Order : order
        ),
        isLoading: false,
      }) as Partial<OrderState>);

      console.log(`✅ Order ${orderId} updated`);
      return true;
    } catch (error) {
      console.error('❌ Error updating order:', error);
      set({ error: 'Failed to update order', isLoading: false });
      return false;
    }
  },

  cancelOrder: async (orderId, reason) => {
    return get().updateOrderStatus(orderId, 'CANCELLED', reason);
  },

  markAsDelivered: async (orderId) => {
    return get().updateOrderStatus(orderId, 'DELIVERED');
  },

  deleteOrder: async (orderId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('⚠️ Deleting order:', orderId);
      
      await ordersApi.delete(orderId);
      
      console.log('✅ Order deleted successfully');
      
      // Actualizar estado local: eliminar la orden
      set((state) => ({
        orders: state.orders.filter(o => o.id !== orderId),
        isLoading: false,
        error: null,
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al eliminar pedido';
      
      set({ 
        isLoading: false,
        error: errorMessage 
      });
      
      return false;
    }
  },

  getOrderById: (id) => {
    return get().orders.find((o) => o.id === id);
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter((o) => o.status === status);
  },

  getPendingOrders: () => {
    return get().orders.filter(
      (o) => o.status === 'PENDING' || o.status === 'READY'
    );
  },

  getOverdueOrders: () => {
    const now = new Date();
    return get().orders.filter((order) => {
      if (order.status === 'DELIVERED' || order.status === 'CANCELLED') return false;
      
      const deliveryDateTime = new Date(`${order.deliveryDate}T${order.deliveryTime}`);
      return deliveryDateTime < now;
    });
  },

  getTodaysDeliveries: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().orders.filter(
      (o) => o.deliveryDate === today && 
             o.status !== 'DELIVERED' && 
             o.status !== 'CANCELLED'
    );
  },

  addCustomer: (customer) => {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      customers: [...state.customers, newCustomer],
    }));
    
    // Persistir en localStorage
    storage.saveCustomers(get().customers);

    return newCustomer;
  },

  updateCustomer: (id, updates) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
    
    // Persistir en localStorage
    storage.saveCustomers(get().customers);
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  searchCustomers: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.phone?.includes(query)
    );
  },
}));
