import { ROLES } from './roles.js';

// Matriz de permisos: { 'resource.action': [roles_permitidos] }
export const PERMISSIONS_MATRIX = {
  // Pedidos
  'pedidos.view': [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLEADO, ROLES.VIEWER],
  'pedidos.edit': [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLEADO],
  'pedidos.cancel': [ROLES.ADMIN, ROLES.MANAGER],
  'pedidos.notify': [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLEADO],
  'pedidos.picking': [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLEADO],

  // Catálogo
  'catalogo.view': [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLEADO, ROLES.VIEWER],
  'catalogo.edit': [ROLES.ADMIN, ROLES.MANAGER],
  'catalogo.delete': [ROLES.ADMIN],

  // Clientes (futuro)
  'clientes.view': [ROLES.ADMIN, ROLES.MANAGER],
  'clientes.edit': [ROLES.ADMIN, ROLES.MANAGER],

  // Pagos (futuro)
  'pagos.view': [ROLES.ADMIN, ROLES.MANAGER],

  // Reportes (futuro)
  'reportes.view': [ROLES.ADMIN, ROLES.MANAGER],
  'reportes.export': [ROLES.ADMIN, ROLES.MANAGER],

  // Usuarios (futuro)
  'usuarios.view': [ROLES.ADMIN],
  'usuarios.manage': [ROLES.ADMIN],

  // Configuración (futuro)
  'configuracion.view': [ROLES.ADMIN, ROLES.MANAGER],
  'configuracion.edit': [ROLES.ADMIN],
};

/**
 * Verifica si un rol tiene permiso para una acción
 * @param {string} role - rol del usuario
 * @param {string} permission - 'resource.action'
 * @returns {boolean}
 */
export function can(role, permission) {
  if (!role) return false;
  const allowedRoles = PERMISSIONS_MATRIX[permission] || [];
  return allowedRoles.includes(role);
}

/**
 * Verifica si un rol tiene permiso para CUALQUIERA de las acciones
 * @param {string} role - rol del usuario
 * @param {string[]} permissions - array de 'resource.action'
 * @returns {boolean}
 */
export function canAny(role, permissions = []) {
  if (!role || !Array.isArray(permissions)) return false;
  return permissions.some(permission => can(role, permission));
}

/**
 * Verifica si un rol tiene permiso para TODAS las acciones
 * @param {string} role - rol del usuario
 * @param {string[]} permissions - array de 'resource.action'
 * @returns {boolean}
 */
export function canAll(role, permissions = []) {
  if (!role || !Array.isArray(permissions)) return false;
  return permissions.every(permission => can(role, permission));
}
