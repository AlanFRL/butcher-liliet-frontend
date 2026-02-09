import { useAuthStore } from '../store';

export const usePermissions = () => {
  const { currentUser } = useAuthStore();
  
  const isAdmin = currentUser?.role === 'ADMIN';
  const canDeleteOrders = isAdmin;
  const canDeleteSales = isAdmin;
  const canDeleteSessions = isAdmin;
  
  return {
    isAdmin,
    canDeleteOrders,
    canDeleteSales,
    canDeleteSessions,
  };
};
