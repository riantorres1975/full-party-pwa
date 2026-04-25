import { usePermissions } from '../../contexts/PermissionsContext';

/**
 * Renderiza contenido solo si el usuario tiene permiso
 *
 * @param {Object} props
 * @param {string} props.permission - 'resource.action' (singular)
 * @param {string[]} props.anyOf - array de permissions (OR) — alternativa a permission
 * @param {string[]} props.allOf - array de permissions (AND) — alternativa a permission
 * @param {React.ReactNode} props.children - contenido a renderizar si tiene permisos
 * @param {React.ReactNode} props.fallback - contenido si NO tiene permisos (default: null)
 *
 * @example
 * <Can permission="pedidos.cancel">
 *   <button onClick={cancelOrder}>Cancelar</button>
 * </Can>
 *
 * <Can anyOf={['pedidos.edit', 'pedidos.notify']}>
 *   <ActionButton />
 * </Can>
 *
 * <Can permission="pedidos.view" fallback={<EmptyState />}>
 *   <OrderList />
 * </Can>
 */
export default function Can({ permission, anyOf, allOf, children, fallback = null }) {
  const { can, canAny, canAll } = usePermissions();

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (anyOf) {
    hasPermission = canAny(anyOf);
  } else if (allOf) {
    hasPermission = canAll(allOf);
  }

  return hasPermission ? children : fallback;
}
