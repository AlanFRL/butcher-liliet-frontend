/**
 * Servicio API centralizado para comunicación con el backend
 * Base URL: Se obtiene de variable de entorno o localhost en desarrollo
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ============= MANEJO DE TOKENS =============

const TOKEN_KEY = 'butcher_auth_token';

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

// ============= CONFIGURACIÓN DE FETCH =============

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Agregar headers existentes
  if (fetchOptions.headers) {
    const existingHeaders = fetchOptions.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  // Agregar token si requiere autenticación
  if (requiresAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Manejar errores HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Error desconocido',
        statusCode: response.status,
      }));

      // Si es 401, limpiar token
      if (response.status === 401) {
        tokenManager.removeToken();
      }

      throw new ApiError(
        errorData.message || `Error ${response.status}`,
        response.status,
        errorData
      );
    }

    // Si es 204 No Content (común en DELETE), retornar undefined
    if (response.status === 204) {
      return undefined as any;
    }

    // Intentar parsear JSON, si falla retornar undefined (para void responses)
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return undefined as any;
      }
      return JSON.parse(text);
    } catch (parseError) {
      // Si no es JSON válido, retornar undefined
      return undefined as any;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Error de red o conexión
    throw new ApiError('Error de conexión con el servidor', 0, error);
  }
}

// ============= CLASE DE ERROR PERSONALIZADA =============

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(
    message: string,
    statusCode: number,
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// ============= UTILIDADES =============

/**
 * Convierte un string decimal del backend a number
 */
export function parseDecimal(value: string | number): number {
  if (typeof value === 'number') return value;
  return parseFloat(value);
}

// ============= TIPOS DE RESPUESTA DEL BACKEND =============

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LoginResponse {
  access_token: string;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  barcode: string | null; // Nullable cuando barcodeType es NONE
  barcodeType: 'STANDARD' | 'WEIGHT_EMBEDDED' | 'NONE';
  saleType: 'UNIT' | 'WEIGHT';
  inventoryType: 'UNIT' | 'WEIGHT' | 'VACUUM_PACKED';
  price: string; // Decimal como string
  costPrice: string | null;
  stockQuantity: string; // Decimal como string
  minStock: string; // Decimal como string
  unit: string | null;
  isActive: boolean;
  trackInventory: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  // Campos de descuento
  discountPrice?: number | null;
  discountActive?: boolean;
  category?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface CashSessionResponse {
  id: string;
  terminalId: string;
  userId: string;
  openingAmount: string; // Decimal
  closingAmount: string | null; // Decimal
  expectedAmount: string; // Decimal
  differenceAmount: string | null; // Decimal
  status: 'OPEN' | 'CLOSED';
  openingNotes: string | null;
  closingNotes: string | null;
  openedAt: string;
  closedAt: string | null;
  closedByUserId?: string | null;
  updatedAt: string;
  terminal?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    fullName: string;
  };
  closedBy?: {
    id: string;
    fullName: string;
  };
}

export interface SaleResponse {
  id: string;
  sessionId: string;
  cashierId: string;
  subtotal: string; // Decimal
  discount: string; // Decimal
  total: string; // Decimal
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED';
  cashAmount: string | null;
  cardAmount: string | null;
  transferAmount: string | null;
  changeAmount: string | null;
  status: 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  customerName: string | null;
  orderId: string | null;
  createdAt: string;
  items?: SaleItemResponse[];
  cashier?: {
    id: string;
    fullName: string;
  };
}

export interface SaleItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: string; // Decimal
  unit: string | null;
  unitPrice: string; // Decimal
  discount: string; // Decimal
  subtotal: string; // Decimal
  // Batch fields (optional, for VACUUM_PACKED products)
  batchId?: string | null;
  batchNumber?: string | null;
  actualWeight?: string | null; // Decimal
}

// ============= API: AUTENTICACIÓN =============

export const authApi = {
  /**
   * Iniciar sesión con username y PIN
   */
  login: async (username: string, pin: string): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
      requiresAuth: false,
    });
  },

  /**
   * Obtener información del usuario autenticado
   */
  me: async (): Promise<UserResponse> => {
    return apiFetch<UserResponse>('/auth/me', {
      method: 'GET',
    });
  },
};

// ============= API: USUARIOS =============

export const usersApi = {
  /**
   * Listar todos los usuarios
   */
  getAll: async (): Promise<UserResponse[]> => {
    return apiFetch<UserResponse[]>('/users', {
      method: 'GET',
    });
  },

  /**
   * Obtener usuario por ID
   */
  getById: async (id: string): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`/users/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Crear nuevo usuario
   */
  create: async (data: {
    username: string;
    fullName: string;
    pin: string;
    password?: string;
    role?: 'ADMIN' | 'MANAGER' | 'CASHIER';
  }): Promise<UserResponse> => {
    return apiFetch<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar usuario
   */
  update: async (
    id: string,
    data: {
      username?: string;
      fullName?: string;
      pin?: string;
      password?: string;
      role?: 'ADMIN' | 'MANAGER' | 'CASHIER';
      isActive?: boolean;
    }
  ): Promise<UserResponse> => {
    return apiFetch<UserResponse>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Desactivar usuario (soft delete)
   */
  deactivate: async (id: string): Promise<void> => {
    return apiFetch<void>(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  /**
   * Eliminar usuario permanentemente (hard delete)
   * Solo si no tiene registros asociados
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= API: PRODUCTOS =============

export const productsApi = {
  /**
   * Listar productos con filtros opcionales
   */
  getAll: async (params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<ProductResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.isActive !== undefined)
      queryParams.append('isActive', String(params.isActive));

    const query = queryParams.toString();
    return apiFetch<ProductResponse[]>(`/products${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener producto por ID
   */
  getById: async (id: string): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`/products/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Buscar producto por código de barras
   */
  getByBarcode: async (barcode: string): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`/products/barcode/${barcode}`, {
      method: 'GET',
    });
  },

  /**
   * Buscar producto por SKU
   */
  getBySku: async (sku: string): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`/products/sku/${sku}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener productos con stock bajo
   */
  getLowStock: async (): Promise<ProductResponse[]> => {
    return apiFetch<ProductResponse[]>('/products/low-stock', {
      method: 'GET',
    });
  },

  /**
   * Crear nuevo producto
   */
  create: async (data: {
    name: string;
    barcode: string | null; // Nullable cuando barcodeType es NONE
    barcodeType: 'STANDARD' | 'WEIGHT_EMBEDDED' | 'NONE';
    description?: string;
    categoryId: string;
    saleType: 'UNIT' | 'WEIGHT';
    inventoryType: 'UNIT' | 'WEIGHT' | 'VACUUM_PACKED';
    price: number;
    costPrice?: number;
    stockQuantity?: number;
    minStock?: number;
    unit?: string;
    trackInventory?: boolean;
  }): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar producto completo
   */
  update: async (id: string, data: {
    name?: string;
    barcode?: string | null;
    barcodeType?: 'STANDARD' | 'WEIGHT_EMBEDDED' | 'NONE';
    description?: string;
    categoryId?: string;
    saleType?: 'UNIT' | 'WEIGHT';
    inventoryType?: 'UNIT' | 'WEIGHT' | 'VACUUM_PACKED';
    price?: number;
    costPrice?: number;
    stockQuantity?: number;
    minStock?: number;
    unit?: string;
    isActive?: boolean;
    trackInventory?: boolean;
  }): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar descuento de producto (solo discountPrice y discountActive)
   */
  updateDiscount: async (id: string, data: {
    discountPrice?: number;
    discountActive: boolean;
  }): Promise<ProductResponse> => {
    return apiFetch<ProductResponse>(`/products/${id}/discount`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ============= API: CATEGORÍAS =============

export const categoriesApi = {
  /**
   * Listar todas las categorías con productCount
   */
  getAll: async (includeInactive = false): Promise<any[]> => {
    const query = includeInactive ? '?includeInactive=true' : '';
    return apiFetch<any[]>(`/categories${query}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener categoría por ID
   */
  getById: async (id: string): Promise<any> => {
    return apiFetch<any>(`/categories/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener conteo de productos de una categoría
   */
  getProductCount: async (id: string): Promise<number> => {
    return apiFetch<number>(`/categories/${id}/product-count`, {
      method: 'GET',
    });
  },

  /**
   * Crear nueva categoría
   */
  create: async (data: {
    name: string;
    description?: string;
  }): Promise<any> => {
    return apiFetch<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar categoría
   */
  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<any> => {
    return apiFetch<any>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Desactivar categoría (soft delete)
   */
  deactivate: async (id: string): Promise<void> => {
    return apiFetch<void>(`/categories/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  /**
   * Eliminar categoría permanentemente (hard delete)
   * Solo si no tiene productos asociados
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= API: TERMINALES =============

export const terminalsApi = {
  /**
   * Listar todas las terminales activas
   */
  getActive: async (): Promise<any[]> => {
    return apiFetch<any[]>('/terminals/active', {
      method: 'GET',
    });
  },

  /**
   * Listar todas las terminales
   */
  getAll: async (): Promise<any[]> => {
    return apiFetch<any[]>('/terminals', {
      method: 'GET',
    });
  },

  /**
   * Obtener terminal por ID
   */
  getById: async (id: string): Promise<any> => {
    return apiFetch<any>(`/terminals/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Crear nueva terminal
   */
  create: async (data: {
    name: string;
    location: string;
  }): Promise<any> => {
    return apiFetch<any>('/terminals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar terminal
   */
  update: async (
    id: string,
    data: {
      name?: string;
      location?: string;
      isActive?: boolean;
    }
  ): Promise<any> => {
    return apiFetch<any>(`/terminals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar terminal
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/terminals/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= API: SESIONES DE CAJA =============

export const cashSessionsApi = {
  /**
   * Obtener sesión abierta del usuario autenticado
   */
  getMySession: async (): Promise<CashSessionResponse | null> => {
    try {
      return await apiFetch<CashSessionResponse>('/cash-sessions/my-session', {
        method: 'GET',
      });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null; // No hay sesión abierta
      }
      throw error;
    }
  },

  /**
   * Obtener sesión abierta de un terminal
   */
  getOpenByTerminal: async (
    terminalId: string
  ): Promise<CashSessionResponse | null> => {
    try {
      return await apiFetch<CashSessionResponse>(
        `/cash-sessions/terminal/${terminalId}/open`,
        {
          method: 'GET',
        }
      );
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Abrir sesión de caja
   */
  open: async (data: {
    terminalId: string;
    openingAmount: number;
    openingNotes?: string;
  }): Promise<CashSessionResponse> => {
    return apiFetch<CashSessionResponse>('/cash-sessions/open', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Cerrar sesión de caja
   */
  close: async (
    sessionId: string,
    data: {
      closingAmount: number;
      closingNotes?: string;
    }
  ): Promise<CashSessionResponse> => {
    return apiFetch<CashSessionResponse>(`/cash-sessions/${sessionId}/close`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Registrar movimiento de efectivo
   */
  addMovement: async (
    sessionId: string,
    data: {
      type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';
      amount: number;
      reason: string;
    }
  ): Promise<any> => {
    return apiFetch<any>(`/cash-sessions/${sessionId}/movements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Obtener estadísticas de la sesión
   */
  getStats: async (sessionId: string): Promise<any> => {
    return apiFetch<any>(`/cash-sessions/${sessionId}/stats`, {
      method: 'GET',
    });
  },

  /**
   * Obtener historial de sesiones con filtros
   * Soporta paginación opcional
   */
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    terminalId?: string;
    userId?: string;
    status?: 'OPEN' | 'CLOSED';
    page?: number;
    limit?: number;
  }): Promise<CashSessionResponse[] | PaginatedResponse<CashSessionResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.terminalId) queryParams.append('terminalId', params.terminalId);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    return apiFetch<CashSessionResponse[] | PaginatedResponse<CashSessionResponse>>(
      `/cash-sessions${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Obtener sesión por ID con detalles completos
   */
  getById: async (sessionId: string): Promise<CashSessionResponse> => {
    return apiFetch<CashSessionResponse>(`/cash-sessions/${sessionId}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener movimientos de una sesión
   */
  getMovements: async (sessionId: string): Promise<any[]> => {
    return apiFetch<any[]>(`/cash-sessions/${sessionId}/movements`, {
      method: 'GET',
    });
  },

  /**
   * Obtener ventas de una sesión
   */
  getSales: async (sessionId: string): Promise<SaleResponse[]> => {
    return apiFetch<SaleResponse[]>(`/sales?sessionId=${sessionId}`, {
      method: 'GET',
    });
  },

  /**
   * Eliminar sesión de caja cerrada (solo ADMIN)
   * Elimina la sesión, sus ventas, movimientos y restaura inventario
   */
  delete: async (sessionId: string): Promise<void> => {
    return apiFetch<void>(`/cash-sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// ============= API: VENTAS =============

export const salesApi = {
  /**
   * Crear venta
   */
  create: async (data: {
    sessionId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discount: number;
    }>;
    discount: number;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED';
    cashAmount?: number;
    cardAmount?: number;
    transferAmount?: number;
    notes?: string;
    customerName?: string;
    orderId?: string;
  }): Promise<SaleResponse> => {
    return apiFetch<SaleResponse>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Listar ventas con filtros
   * Soporta paginación opcional
   */
  getAll: async (params?: {
    sessionId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<SaleResponse[] | PaginatedResponse<SaleResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.sessionId) queryParams.append('sessionId', params.sessionId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    return apiFetch<SaleResponse[] | PaginatedResponse<SaleResponse>>(`/sales${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * NOTA: Este endpoint NO EXISTE en el backend actual
   * Los items ya vienen incluidos en GET /sales?sessionId=XXX
   * Mantener comentado por si el backend lo implementa en el futuro
   */
  // getSaleItems: async (saleId: string): Promise<SaleItemResponse[]> => {
  //   return apiFetch<SaleItemResponse[]>(`/sales/${saleId}/items`, {
  //     method: 'GET',
  //   });
  // },

  /**
   * Obtener estadísticas de ventas de una sesión
   */
  getSessionStats: async (sessionId: string): Promise<any> => {
    return apiFetch<any>(`/sales/session/${sessionId}/stats`, {
      method: 'GET',
    });
  },

  /**
   * Obtener estadísticas generales de ventas por rango de fechas
   */
  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    return apiFetch<any>(`/sales/statistics${queryParams.toString() ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Cancelar venta
   */
  cancel: async (saleId: string, reason: string): Promise<SaleResponse> => {
    return apiFetch<SaleResponse>(`/sales/${saleId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Eliminar venta (solo ADMIN)
   * Restaura inventario, limpia orden asociada y recalcula sesión
   */
  delete: async (saleId: string): Promise<void> => {
    return apiFetch<void>(`/sales/${saleId}`, {
      method: 'DELETE',
    });
  },
};

// ============= API: PEDIDOS =============

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal: string;
  discount: string;
  total: string;
  deposit?: string;
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'DELIVERED' | 'CANCELLED';
  deliveryDate: string;
  deliveryTime?: string;
  notes?: string;
  internalNotes?: string;
  createdBy: string;
  saleId?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items?: OrderItemResponse[];
  creator?: {
    id: string;
    fullName: string;
  };
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  batchId?: string;
  productName: string;
  productSku: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  subtotal: string;
  notes?: string;
  batch?: {
    id: string;
    batchNumber: string;
    actualWeight: string;
    unitPrice: string;
    isSold: boolean;
  };
}

export const ordersApi = {
  /**
   * Crear pedido
   */
  create: async (data: {
    customerId: string; // Add customer ID requirement
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    items: Array<{
      productId: string;
      batchId?: string;
      quantity: number;
      unitPrice?: number; // Precio unitario (puede ser de balanza)
      discount?: number;
      notes?: string;
    }>;
    discount?: number;
    deposit?: number;
    deliveryDate: string;
    deliveryTime?: string;
    notes?: string;
    internalNotes?: string;
  }): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Listar pedidos con filtros
   */
  getAll: async (params?: {
    status?: string;
    customerName?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customerName) queryParams.append('customerName', params.customerName);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiFetch<OrderResponse[]>(`/orders${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener pedido por ID
   */
  getById: async (id: string): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>(`/orders/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Actualizar pedido
   */
  update: async (id: string, data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    discount?: number;
    deposit?: number;
    deliveryDate?: string;
    deliveryTime?: string;
    notes?: string;
    internalNotes?: string;
    items?: Array<{
      productId: string;
      batchId?: string;
      quantity: number;
      discount?: number;
      notes?: string;
    }>;
  }): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Confirmar pedido (PENDING -> CONFIRMED)
   */
  confirm: async (id: string): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>(`/orders/${id}/confirm`, {
      method: 'PATCH',
    });
  },

  /**
   * Marcar como listo (CONFIRMED -> READY)
   */
  markAsReady: async (id: string): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>(`/orders/${id}/ready`, {
      method: 'PATCH',
    });
  },

  /**
   * Marcar como entregado (READY -> DELIVERED)
   * Descuenta stock automáticamente si no hay venta asociada
   */
  markAsDelivered: async (id: string): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>(`/orders/${id}/delivered`, {
      method: 'PATCH',
    });
  },

  /**
   * Cancelar pedido
   */
  cancel: async (id: string, reason: string): Promise<OrderResponse> => {
    return apiFetch<OrderResponse>(`/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Eliminar pedido (solo ADMIN)
   * Solo pedidos sin venta asociada y de la sesión actual
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtener estadísticas de pedidos
   */
  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiFetch<any>(`/orders/statistics${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },
};

// ============= CUSTOMERS API =============

export interface CustomerResponse {
  id: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const customersApi = {
  /**
   * Crear cliente
   */
  create: async (data: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<CustomerResponse> => {
    return apiFetch<CustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Listar clientes con búsqueda opcional
   */
  getAll: async (search?: string): Promise<CustomerResponse[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiFetch<CustomerResponse[]>(`/customers${query}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener cliente por ID
   */
  getById: async (id: string): Promise<CustomerResponse> => {
    return apiFetch<CustomerResponse>(`/customers/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Actualizar cliente
   */
  update: async (id: string, data: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<CustomerResponse> => {
    return apiFetch<CustomerResponse>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar cliente
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
