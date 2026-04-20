import { createContext, useContext, useMemo } from 'react';
import { usePedidosAdmin } from '../hooks/usePedidosAdmin';

const AdminDataContext = createContext();

export function AdminDataProvider({ children, toast, confirmCancelar }) {
  const pedidosAdmin = usePedidosAdmin({ toast, confirmCancelar });

  const value = useMemo(() => ({
    ...pedidosAdmin,
  }), [pedidosAdmin]);

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
}
