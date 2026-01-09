// ============= ENUMS Y TIPOS BASE =============

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type SaleType = 'WEIGHT' | 'UNIT';

export type CashSessionStatus = 'OPEN' | 'CLOSED';

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'QR' | 'CARD' | 'MIXED';

export type MovementType = 
  | 'PURCHASE_IN' 
  | 'ADJUST_IN' 
  | 'ADJUST_OUT' 
  | 'WASTE' 
  | 'SALE_OUT' 
  | 'RETURN_IN';

export type CashMovementType = 'IN' | 'OUT';

export type OrderStatus = 'PENDING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// ============= INTERFACES =============

export interface User {
  id: string;
  role: UserRole;
  username: string;
  fullName: string;
  pin: string;
  isActive: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  categoryId: string | null;
  sku: string;
  name: string;
  saleType: SaleType;
  unit: string;
  price: number;
  taxRate: number;
  isActive: boolean;
  isFavorite?: boolean; // Para el prototipo
}

export interface CashSession {
  id: string;
  terminalId: string;
  userId: string;
  status: CashSessionStatus;
  openedAt: string;
  openingAmount: number;
  openingNote: string | null;
  closedAt: string | null;
  closingNote: string | null;
  expectedCash: number | null;
  countedCash: number | null;
  cashDifference: number | null;
}

export interface CashMovement {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  saleType: SaleType;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  cashSessionId: string;
  terminalId: string;
  userId: string;
  status: SaleStatus;
  saleNumber: number;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  cashPaid?: number;
  cashChange?: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
}

export interface InventoryBalance {
  id: string;
  productId: string;
  warehouseId: string;
  qty: number;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  type: MovementType;
  productId: string;
  warehouseId: string;
  qty: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Terminal {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
}

// ============= TIPOS PARA EL UI =============

export interface CartItem extends SaleItem {
  product: Product;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalAmount: number;
  cashAmount: number;
  qrAmount: number;
  cardAmount: number;
}

export interface ProductSalesSummary {
  productId: string;
  productName: string;
  totalQty: number;
  totalAmount: number;
  salesCount: number;
}

// ============= PEDIDOS/RESERVAS =============

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: number; // Correlativo para fácil identificación
  customerId: string;
  customerName: string; // Snapshot para histórico
  customerPhone: string; // Snapshot
  status: OrderStatus;
  priority: OrderPriority;
  deliveryDate: string; // Fecha de entrega
  deliveryTime: string; // Hora de entrega (HH:mm)
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string; // Notas del pedido
  createdBy: string; // Usuario que creó el pedido
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string; // Snapshot
  productSku: string; // Snapshot
  saleType: SaleType;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  notes?: string; // Notas específicas del item (ej: "corte fino", "sin grasa")
}
