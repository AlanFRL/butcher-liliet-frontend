/**
 * Utilidades para persistencia en localStorage
 * Maneja el almacenamiento y recuperación de datos del navegador
 */

import type { CashSession, Sale, Order, Customer } from '../types';

const KEYS = {
  // Configuración de UI
  COLOR_SCHEME: 'butcher_color_scheme',
  SELECTED_TERMINAL: 'butcher_selected_terminal',
  
  // Sesiones y operaciones
  CURRENT_SESSION: 'butcher_current_session',
  SESSION_HISTORY: 'butcher_session_history',
  SALES: 'butcher_sales',
  ORDERS: 'butcher_orders',
  CUSTOMERS: 'butcher_customers',
  
  // Contadores
  SALE_COUNTER: 'butcher_sale_counter',
  ORDER_COUNTER: 'butcher_order_counter',
} as const;

// ============= CONFIGURACIÓN DE UI =============

export const getColorScheme = (): 'light' | 'dark' | null => {
  const stored = localStorage.getItem(KEYS.COLOR_SCHEME);
  return stored as 'light' | 'dark' | null;
};

export const setColorScheme = (scheme: 'light' | 'dark'): void => {
  localStorage.setItem(KEYS.COLOR_SCHEME, scheme);
};

export const getSelectedTerminal = (): string | null => {
  return localStorage.getItem(KEYS.SELECTED_TERMINAL);
};

export const setSelectedTerminal = (terminalId: string): void => {
  localStorage.setItem(KEYS.SELECTED_TERMINAL, terminalId);
};

// ============= SESIONES DE CAJA =============

export const getCurrentSession = (): CashSession | null => {
  try {
    const stored = localStorage.getItem(KEYS.CURRENT_SESSION);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading current session:', error);
    return null;
  }
};

export const saveCurrentSession = (session: CashSession | null): void => {
  try {
    if (session) {
      localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEYS.CURRENT_SESSION);
    }
  } catch (error) {
    console.error('Error saving current session:', error);
  }
};

export const getSessionHistory = (): CashSession[] => {
  try {
    const stored = localStorage.getItem(KEYS.SESSION_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading session history:', error);
    return [];
  }
};

export const addToSessionHistory = (session: CashSession): void => {
  try {
    const history = getSessionHistory();
    history.push(session);
    // Mantener solo últimas 50 sesiones
    const trimmed = history.slice(-50);
    localStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving session history:', error);
  }
};

// ============= VENTAS =============

export const getSales = (): Sale[] => {
  try {
    const stored = localStorage.getItem(KEYS.SALES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading sales:', error);
    return [];
  }
};

export const saveSales = (sales: Sale[]): void => {
  try {
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  } catch (error) {
    console.error('Error saving sales:', error);
  }
};

export const getSaleCounter = (): number => {
  try {
    const stored = localStorage.getItem(KEYS.SALE_COUNTER);
    return stored ? parseInt(stored, 10) : 1;
  } catch (error) {
    console.error('Error loading sale counter:', error);
    return 1;
  }
};

export const saveSaleCounter = (counter: number): void => {
  try {
    localStorage.setItem(KEYS.SALE_COUNTER, counter.toString());
  } catch (error) {
    console.error('Error saving sale counter:', error);
  }
};

// ============= PEDIDOS =============

export const getOrders = (): Order[] => {
  try {
    const stored = localStorage.getItem(KEYS.ORDERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading orders:', error);
    return [];
  }
};

export const saveOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
};

export const getOrderCounter = (): number => {
  try {
    const stored = localStorage.getItem(KEYS.ORDER_COUNTER);
    return stored ? parseInt(stored, 10) : 1;
  } catch (error) {
    console.error('Error loading order counter:', error);
    return 1;
  }
};

export const saveOrderCounter = (counter: number): void => {
  try {
    localStorage.setItem(KEYS.ORDER_COUNTER, counter.toString());
  } catch (error) {
    console.error('Error saving order counter:', error);
  }
};

// ============= CLIENTES =============

export const getCustomers = (): Customer[] => {
  try {
    const stored = localStorage.getItem(KEYS.CUSTOMERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
};

export const saveCustomers = (customers: Customer[]): void => {
  try {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (error) {
    console.error('Error saving customers:', error);
  }
};

// ============= LIMPIEZA =============

export const clearAllData = (): void => {
  if (confirm('¿Estás seguro de que deseas limpiar TODOS los datos? Esta acción no se puede deshacer.')) {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    window.location.reload();
  }
};

export const exportData = (): string => {
  const data = {
    currentSession: getCurrentSession(),
    sessionHistory: getSessionHistory(),
    sales: getSales(),
    orders: getOrders(),
    customers: getCustomers(),
    saleCounter: getSaleCounter(),
    orderCounter: getOrderCounter(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};
