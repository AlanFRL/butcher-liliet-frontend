/**
 * Utilidades para persistencia en localStorage
 * Maneja el almacenamiento y recuperación de datos del navegador
 */

import type { Sale, Customer } from '../types';

const KEYS = {
  // Configuración de UI
  COLOR_SCHEME: 'butcher_color_scheme',
  SELECTED_TERMINAL: 'butcher_selected_terminal',
  
  // Operaciones
  SALES: 'butcher_sales',
  CUSTOMERS: 'butcher_customers',
  
  // Contadores
  SALE_COUNTER: 'butcher_sale_counter',
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
