// ============= ENUMS Y TIPOS BASE =============

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type SaleType = 'WEIGHT' | 'UNIT';

export type CashSessionStatus = 'OPEN' | 'CLOSED';

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED';

export type MovementType = 
  | 'PURCHASE_IN' 
  | 'ADJUST_IN' 
  | 'ADJUST_OUT' 
  | 'WASTE' 
  | 'SALE_OUT' 
  | 'RETURN_IN';

export type CashMovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';

export type OrderStatus = 'PENDING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type InventoryType = 
  | 'UNIT'            // Productos por unidad con control de stock (latas, carbón, etc.)
  | 'WEIGHT'          // Carnes de corte - peso manual sin control de stock
  | 'VACUUM_PACKED'   // Carnes al vacío - unidades con precio variable (requiere lotes)
  | 'UNIT_STOCK'      // Legacy: Productos por unidad con control de stock
  | 'UNIT_VARIABLE'   // Legacy: Carnes al vacío - unidades con precio variable en código de barras
  | 'BATCH'           // Productos con lotes
  | 'REGULAR'         // Productos regulares sin lotes
  | 'WEIGHT_MANUAL'   // Legacy: Carnes de corte - peso manual sin control de stock
  | 'NO_STOCK';       // Legacy: Productos sin control de inventario

export type BarcodeType =
  | 'STANDARD'        // Código de barras estándar (EAN-13, UPC, etc.)
  | 'PRICE_EMBEDDED'  // Código con precio embebido (balanzas)
  | 'WEIGHT_EMBEDDED' // Código con peso embebido
  | 'INTERNAL';       // Código interno del negocio

// ============= INTERFACES =============

export interface User {
  id: string;
  role: UserRole;
  username: string;
  fullName: string;
  pin: string;
  isActive: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
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
  
  // Sistema de inventario híbrido (TODO: migrar datos existentes)
  inventoryType?: InventoryType;
  barcodeType?: BarcodeType;
  barcodePrefix?: string; // Prefijo para identificar en scanner (ej: "20" para precios embebidos)
  
  // Control de stock (solo para UNIT_STOCK y UNIT_VARIABLE)
  stockUnits?: number;     // Stock disponible en unidades
  minStockAlert?: number;  // Alerta de stock mínimo
  
  // Para WEIGHT_MANUAL (referencia, no se controla stock)
  estimatedStockKg?: number; // Solo informativo
}

export interface CashSession {
  id: string;
  terminalId: string;
  userId: string;
  status: CashSessionStatus;
  openedAt: string;
  openingAmount: number;
  openingNotes: string | null;
  closedAt: string | null;
  closingNotes: string | null;
  expectedAmount: number | null;
  closingAmount: number | null;
  differenceAmount: number | null;
  user?: {
    id: string;
    fullName: string;
    username?: string;
  };
  closedBy?: {
    id: string;
    fullName: string;
    username?: string;
  };
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
  cashierId: string; // userId en backend se llama cashierId
  status: SaleStatus;
  items: SaleItem[];
  subtotal: number;
  discount: number; // discountTotal → discount
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount: number | null;
  cardAmount: number | null;
  transferAmount: number | null;
  changeAmount: number | null; // vuelto
  notes: string | null;
  customerName: string | null;
  orderId?: string;
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
  batchId?: string; // ID del lote (para productos VACUUM_PACKED)
  batchNumber?: string; // Número de lote para mostrar
  actualWeight?: number; // Peso real del lote (para productos VACUUM_PACKED)
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  actualWeight: number | string;
  unitPrice: number | string;
  unitCost: number | string;
  isSold: boolean;
  packedAt: string;
  expiryDate: string | null;
  notes?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalAmount: number;
  cashAmount: number;
  transferAmount: number;
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
  deliveryDate: string; // Fecha de entrega
  deliveryTime: string; // Hora de entrega (HH:mm)
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string; // Notas del pedido
  createdBy: string; // Usuario que creó el pedido
  saleId?: string; // Link a la venta cuando se cobra el pedido
  deliveredBy?: string; // Usuario que entregó/cobró el pedido
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
  batchId?: string; // ID del lote específico (para productos VACUUM_PACKED)
  productName: string; // Snapshot
  productSku: string; // Snapshot
  saleType: SaleType;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  discount?: number; // Descuento aplicado al item
  notes?: string; // Notas específicas del item (ej: "corte fino", "sin grasa")
  batch?: ProductBatch; // Información del lote (si aplica)
}
