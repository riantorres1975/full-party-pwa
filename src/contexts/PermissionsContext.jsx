import { createContext, useContext, useMemo } from 'react';
import { can, canAny, canAll } from '../lib/permissions';
import { ROLES } from '../lib/roles';

const PermissionsContext = createContext();

/**
 * PermissionsProvider — determina role del usuario y expone helpers
 *
 * FASE 2: Todos los usuarios autenticados válidos son "admin"
 * FASE 3: Leer role de tabla profiles.role en Supabase
 */
export function PermissionsProvider({ children, user }) {
  // FASE 2: hardcoded a admin para todos los usuarios válidos
  // FASE 3: leer de Supabase profiles table
  const role = user?.email ? ROLES.ADMIN : null;

  const value = useMemo(() => ({
    role,
    user,
    can: (permission) => can(role, permission),
    canAny: (permissions) => canAny(role, permissions),
    canAll: (permissions) => canAll(role, permissions),
  }), [role, user]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
