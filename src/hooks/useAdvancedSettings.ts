import { useState, useEffect } from 'react';

interface AdvancedSettings {
  allowDeleteOrders: boolean;
  allowDeleteSales: boolean;
}

/**
 * Hook para manejar configuraciones avanzadas del sistema
 * almacenadas en localStorage
 */
export const useAdvancedSettings = (): AdvancedSettings => {
  const [allowDeleteOrders, setAllowDeleteOrders] = useState(false);
  const [allowDeleteSales, setAllowDeleteSales] = useState(false);

  // Cargar configuración inicial desde localStorage
  useEffect(() => {
    const loadSettings = () => {
      const storedDeleteOrders = localStorage.getItem('butcher_allow_delete_orders') === 'true';
      const storedDeleteSales = localStorage.getItem('butcher_allow_delete_sales') === 'true';
      
      setAllowDeleteOrders(storedDeleteOrders);
      setAllowDeleteSales(storedDeleteSales);
    };

    loadSettings();

    // Listener para cambios en localStorage (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'butcher_allow_delete_orders') {
        setAllowDeleteOrders(e.newValue === 'true');
      } else if (e.key === 'butcher_allow_delete_sales') {
        setAllowDeleteSales(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    allowDeleteOrders,
    allowDeleteSales,
  };
};
