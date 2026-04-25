import { usePermissions } from '../contexts/PermissionsContext';

/**
 * Hook para verificar permisos
 * @param {string} permission - 'resource.action'
 * @returns {boolean}
 */
export function usePermission(permission) {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Hook para verificar múltiples permisos (OR)
 * @param {string[]} permissions - array de 'resource.action'
 * @returns {boolean}
 */
export function usePermissionAny(permissions) {
  const { canAny } = usePermissions();
  return canAny(permissions);
}

/**
 * Hook para verificar múltiples permisos (AND)
 * @param {string[]} permissions - array de 'resource.action'
 * @returns {boolean}
 */
export function usePermissionAll(permissions) {
  const { canAll } = usePermissions();
  return canAll(permissions);
}

/**
 * Hook para obtener el rol actual
 * @returns {string|null}
 */
export function useRole() {
  const { role } = usePermissions();
  return role;
}
