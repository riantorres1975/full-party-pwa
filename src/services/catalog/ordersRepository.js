// ─────────────────────────────────────────────────────────────────────────────
// ordersRepository — creación de pedidos del catálogo V2.
// El servidor valida cliente/entrega, recalcula precios, RESERVA inventario
// transaccionalmente y guarda el snapshot completo (§22, §27).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { adaptCartItemsForRpc } from './adapters.js';
import { CATALOG_ERROR_TYPES, CatalogError, classifyCatalogError } from './errors.js';

/**
 * Crea el pedido V2 en el servidor.
 *
 * @param {object} input
 * @param {string} input.nombre        - nombre del cliente (2–120)
 * @param {string} input.telefono      - 10 dígitos
 * @param {'tienda'|'envio'} input.tipoEntrega
 * @param {string|null} input.direccion - requerida si tipoEntrega = 'envio'
 * @param {Array<{variant_id:string, sale_presentation_id:string, quantity:number}>} input.items
 * @param {string|null} [input.idempotencyKey] - UUID para reintentos seguros
 * @param {string|null} [input.locationSlug]   - sucursal de surtido (default: primera activa)
 * @returns {Promise<{folio:string, total:number, replay:boolean}>}
 */
export async function createOrder(
  { nombre, telefono, tipoEntrega, direccion = null, items, idempotencyKey = null, locationSlug = null },
  { client = defaultClient, signal } = {},
) {
  const safeItems = adaptCartItemsForRpc(items);

  if (safeItems.length === 0) {
    throw new CatalogError(CATALOG_ERROR_TYPES.INVALID, 'El carrito esta vacio.');
  }

  let request = client.rpc('catalog_create_order', {
    p_cliente_nombre: nombre,
    p_cliente_telefono: telefono,
    p_tipo_entrega: tipoEntrega,
    p_direccion: direccion,
    p_items: safeItems,
    p_idempotency_key: idempotencyKey,
    p_location_slug: locationSlug,
  });
  if (signal && typeof request.abortSignal === 'function') {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;
  if (error) throw classifyCatalogError(error, 'No se pudo registrar el pedido.');

  return {
    folio: data?.folio ?? null,
    total: Number(data?.total) || 0,
    replay: data?.replay === true,
  };
}
