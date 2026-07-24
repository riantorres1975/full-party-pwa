// Extensiones .js explícitas: este módulo también se importa desde las
// pruebas unitarias con node --test (ESM estricto).
import { fetchPublicProductPage } from './productosPublicos.js';
import { getPublicRestClient } from './supabasePublicRest.js';

// Máximo de artículos distintos permitido por el RPC de creación.
const MAX_CART_ITEMS = 50;

/**
 * Fusiona los items del carrito con el estado fresco del servidor.
 * - Producto presente: se actualizan precio, stock, activo, nombre e imagen,
 *   conservando la cantidad elegida por el cliente.
 * - Producto ausente (eliminado o fuera del catálogo público): se marca como
 *   no disponible para que la UI lo señale y bloquee el checkout antes de
 *   que el servidor rechace el pedido con un error genérico.
 *
 * @param {Array} items — items del carrito (con cantidad).
 * @param {Array} productosServidor — filas frescas de la tabla productos.
 * @returns {Array} items fusionados (mismo orden que el carrito).
 */
export function mergeEstadoCarrito(items, productosServidor) {
  const porId = new Map(
    (Array.isArray(productosServidor) ? productosServidor : [])
      .map((producto) => [String(producto?.id ?? ''), producto]),
  );

  return (Array.isArray(items) ? items : []).map((item) => {
    const real = porId.get(String(item?.id ?? ''));
    if (!real) {
      return { ...item, activo: false, __noDisponible: true };
    }
    return { ...item, ...real, id: item.id, cantidad: item.cantidad };
  });
}

/**
 * Consulta el estado actual en el servidor de los productos del carrito.
 * Falla controlada: devuelve { error } sin lanzar para que el caller decida
 * (el RPC de creación sigue siendo el backstop de validación).
 *
 * @param {Array<string|number>} ids — ids de producto del carrito.
 * @returns {Promise<{ productos: Array, error: object|null }>}
 */
export async function fetchEstadoCarrito(ids) {
  const safeIds = [...new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => String(id ?? '').trim())
      .filter(Boolean),
  )].slice(0, MAX_CART_ITEMS);

  if (safeIds.length === 0) return { productos: [], error: null };

  const result = await fetchPublicProductPage(getPublicRestClient(), {
    limit: safeIds.length,
    filters: { ids: safeIds },
  });

  return {
    productos: result.data,
    error: result.error ?? null,
  };
}
