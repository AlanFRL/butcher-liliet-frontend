import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Product,
  ProductCategory,
  CashSession,
  CashMovement,
  Sale,
  // SaleItem,
  // Payment,
  Terminal,
  CartItem,
  Order,
  OrderItem,
  Customer,
  OrderStatus,
  OrderPriority,
} from '../types';
import { mockUsers, mockProducts, mockCategories, mockTerminals } from '../data/mockData';

// ============= INTERFACES DEL STORE =============

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, pin: string) => boolean;
  logout: () => void;
}

interface CashState {
  currentSession: CashSession | null;
  cashMovements: CashMovement[];
  openCashSession: (userId: string, terminalId: string, openingAmount: number, note?: string) => void;
  closeCashSession: (countedCash: number, note?: string) => void;
  addCashMovement: (type: 'IN' | 'OUT', amount: number, reason: string) => void;
}

interface ProductState {
  products: Product[];
  categories: ProductCategory[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  toggleProductActive: (id: string) => void;
  toggleProductFavorite: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  getFavoriteProducts: () => Product[];
}

interface CartState {
  cartItems: CartItem[];
  addToCart: (product: Product, qty: number) => void;
  updateCartItem: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartSubtotal: () => number;
}

interface SalesState {
  sales: Sale[];
  saleCounter: number;
  completeSale: (paymentMethod: 'CASH' | 'QR' | 'CARD', cashPaid?: number) => Sale | null;
  getSalesByDateRange: (from: string, to: string) => Sale[];
  getTodaysSales: () => Sale[];
}

interface AppState {
  terminals: Terminal[];
  currentTerminal: Terminal | null;
  setCurrentTerminal: (terminal: Terminal) => void;
}

// ============= STORE DE AUTENTICACIÓN =============

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  
  login: (username: string, pin: string) => {
    const user = mockUsers.find(
      (u) => u.username === username && u.pin === pin && u.isActive
    );
    
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
  },
}));

// ============= STORE DE CAJA =============

export const useCashStore = create<CashState>((set, get) => ({
  currentSession: null,
  cashMovements: [],
  
  openCashSession: (userId: string, terminalId: string, openingAmount: number, note = '') => {
    const newSession: CashSession = {
      id: uuidv4(),
      terminalId,
      userId,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      openingAmount,
      openingNote: note,
      closedAt: null,
      closingNote: null,
      expectedCash: null,
      countedCash: null,
      cashDifference: null,
    };
    
    set({ currentSession: newSession, cashMovements: [] });
  },
  
  closeCashSession: (countedCash: number, note = '') => {
    const { currentSession, cashMovements } = get();
    if (!currentSession) return;
    
    // Calcular efectivo esperado
    const salesState = useSalesStore.getState();
    const sessionSales = salesState.sales.filter(
      (s) => s.cashSessionId === currentSession.id && s.status === 'COMPLETED'
    );
    
    const cashSales = sessionSales.reduce((sum, sale) => {
      const cashPayments = sale.items.reduce((total, item) => total + item.total, 0);
      return sum + cashPayments;
    }, 0);
    
    const cashIn = cashMovements
      .filter((m) => m.type === 'IN')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const cashOut = cashMovements
      .filter((m) => m.type === 'OUT')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const expectedCash = currentSession.openingAmount + cashSales + cashIn - cashOut;
    const cashDifference = countedCash - expectedCash;
    
    const updatedSession: CashSession = {
      ...currentSession,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closingNote: note,
      expectedCash,
      countedCash,
      cashDifference,
    };
    
    set({ currentSession: updatedSession });
  },
  
  addCashMovement: (type: 'IN' | 'OUT', amount: number, reason: string) => {
    const { currentSession, cashMovements } = get();
    if (!currentSession) return;
    
    const authState = useAuthStore.getState();
    if (!authState.currentUser) return;
    
    const newMovement: CashMovement = {
      id: uuidv4(),
      cashSessionId: currentSession.id,
      type,
      amount,
      reason,
      createdBy: authState.currentUser.id,
      createdAt: new Date().toISOString(),
    };
    
    set({ cashMovements: [...cashMovements, newMovement] });
  },
}));

// ============= STORE DE PRODUCTOS =============

export const useProductStore = create<ProductState>((set, get) => ({
  products: mockProducts,
  categories: mockCategories,
  
  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
    };
    set((state) => ({ products: [...state.products, newProduct] }));
  },
  
  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
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
}));

// ============= STORE DE CARRITO =============

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  
  addToCart: (product, qty) => {
    const { cartItems } = get();
    const existingItem = cartItems.find((item) => item.productId === product.id);
    
    if (existingItem) {
      // Actualizar cantidad
      set({
        cartItems: cartItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                qty: item.qty + qty,
                total: (item.qty + qty) * item.unitPrice,
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
        qty,
        unitPrice: product.price,
        discount: 0,
        total: qty * product.price,
        product,
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },
  
  updateCartItem: (itemId, qty) => {
    // No eliminar durante edición, solo validar que no sea negativo
    if (qty < 0) {
      return;
    }
    
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              qty,
              total: qty * item.unitPrice - item.discount,
            }
          : item
      ),
    }));
  },
  
  removeFromCart: (itemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }));
  },
  
  clearCart: () => {
    set({ cartItems: [] });
  },
  
  getCartSubtotal: () => {
    return get().cartItems.reduce((sum, item) => sum + item.total, 0);
  },
  
  getCartTotal: () => {
    return get().getCartSubtotal();
  },
}));

// ============= STORE DE VENTAS =============

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  saleCounter: 1,
  
  completeSale: (_paymentMethod, _cashPaid) => {
    const cashState = useCashStore.getState();
    const cartState = useCartStore.getState();
    const authState = useAuthStore.getState();
    const appState = useAppStore.getState();
    
    if (!cashState.currentSession || !authState.currentUser || !appState.currentTerminal) {
      return null;
    }
    
    if (cartState.cartItems.length === 0) {
      return null;
    }
    
    const { saleCounter } = get();
    const subtotal = cartState.getCartSubtotal();
    const total = cartState.getCartTotal();
    
    const newSale: Sale = {
      id: uuidv4(),
      cashSessionId: cashState.currentSession.id,
      terminalId: appState.currentTerminal.id,
      userId: authState.currentUser.id,
      status: 'COMPLETED',
      saleNumber: saleCounter,
      items: cartState.cartItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        saleType: item.saleType,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
      subtotal,
      discountTotal: 0,
      taxTotal: 0,
      total,
      notes: null,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    
    // Crear pago
    // const _payment: Payment = {
    //   id: uuidv4(),
    //   saleId: newSale.id,
    //   method: paymentMethod,
    //   amount: total,
    //   cashPaid: paymentMethod === 'CASH' ? cashPaid : undefined,
    //   cashChange: paymentMethod === 'CASH' && cashPaid ? cashPaid - total : undefined,
    //   status: 'CONFIRMED',
    //   createdAt: new Date().toISOString(),
    // };
    
    set((state) => ({
      sales: [...state.sales, newSale],
      saleCounter: saleCounter + 1,
    }));
    
    // Limpiar carrito
    cartState.clearCart();
    
    return newSale;
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
}));

// ============= STORE DE APP =============

export const useAppStore = create<AppState>((set) => ({
  terminals: mockTerminals,
  currentTerminal: mockTerminals[0], // Terminal por defecto
  
  setCurrentTerminal: (terminal) => {
    set({ currentTerminal: terminal });
  },
}));

// ============= STORE DE PEDIDOS =============

interface OrderState {
  orders: Order[];
  customers: Customer[];
  orderCounter: number;
  createOrder: (
    customerId: string,
    customerName: string,
    customerPhone: string,
    deliveryDate: string,
    deliveryTime: string,
    items: Omit<OrderItem, 'id' | 'orderId'>[],
    priority: OrderPriority,
    notes?: string
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPendingOrders: () => Order[];
  getOverdueOrders: () => Order[];
  getTodaysDeliveries: () => Order[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  searchCustomers: (query: string) => Customer[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  customers: [],
  orderCounter: 1,

  createOrder: (customerId, customerName, customerPhone, deliveryDate, deliveryTime, items, priority, notes) => {
    const orderNumber = get().orderCounter;
    const { currentUser } = useAuthStore.getState();
    
    const orderItems: OrderItem[] = items.map((item) => ({
      ...item,
      id: uuidv4(),
      orderId: '', // Se asignará después
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    
    const order: Order = {
      id: uuidv4(),
      orderNumber,
      customerId,
      customerName,
      customerPhone,
      status: 'PENDING',
      priority,
      deliveryDate,
      deliveryTime,
      items: orderItems.map(item => ({ ...item, orderId: '' })),
      subtotal,
      discount: 0,
      total: subtotal,
      notes,
      createdBy: currentUser?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Asignar orderId a los items
    order.items = order.items.map(item => ({ ...item, orderId: order.id }));

    set((state) => ({
      orders: [...state.orders, order],
      orderCounter: orderNumber + 1,
    }));

    return order;
  },

  updateOrderStatus: (orderId, status, reason) => {
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;

        const updates: Partial<Order> = {
          status,
          updatedAt: new Date().toISOString(),
        };

        if (status === 'DELIVERED') {
          updates.completedAt = new Date().toISOString();
        } else if (status === 'CANCELLED') {
          updates.cancelledAt = new Date().toISOString();
          updates.cancellationReason = reason;
        }

        return { ...order, ...updates };
      }),
    }));
  },

  updateOrder: (orderId, updates) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, ...updates, updatedAt: new Date().toISOString() }
          : order
      ),
    }));
  },

  cancelOrder: (orderId, reason) => {
    get().updateOrderStatus(orderId, 'CANCELLED', reason);
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
    return get().orders.filter((o) => o.deliveryDate === today);
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

    return newCustomer;
  },

  updateCustomer: (id, updates) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  searchCustomers: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query)
    );
  },
}));
