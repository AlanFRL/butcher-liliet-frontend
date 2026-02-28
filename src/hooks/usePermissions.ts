import { useAuthStore } from '../store';

export const usePermissions = () => {
  const { currentUser } = useAuthStore();
  
  const isAdmin = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER';
  const isCashier = currentUser?.role === 'CASHIER';
  
  // Solo ADMIN y MANAGER pueden eliminar pedidos, ventas y sesiones
  // La configuración de "Habilitar eliminación" NO aplica a CASHIER
  const canDeleteOrders = isAdmin || isManager;
  const canDeleteSales = isAdmin || isManager;
  const canDeleteSessions = isAdmin || isManager;
  
  // Solo ADMIN y MANAGER pueden crear/editar/eliminar productos y descuentos
  const canManageProducts = isAdmin || isManager;
  
  return {
    isAdmin,
    isManager,
    isCashier,
    canDeleteOrders,
    canDeleteSales,
    canDeleteSessions,
    canManageProducts,
  };
};
