/**
 * Clasifica los errores devueltos por el RPC `crear_pedido_publico` (y por la
 * red) en tipos accionables para la UI de checkout.
 *
 * Los mensajes vienen de los triggers/RPC en:
 *  - supabase_public_order_rpc.sql  (validaciones: 'Invalid customer name', ...)
 *  - supabase_order_integrity.sql   (inventario: 'Product is unavailable', ...)
 *  - supabase_rate_limit.sql        ('Pedido duplicado detectado...', 'Demasiados pedidos...')
 *
 * @param {unknown} err — Error de PostgREST, de red o genérico.
 * @returns {'duplicado'|'limite'|'inventario'|'validacion'|'deshabilitado'|'red'|'desconocido'}
 */
export function clasificarErrorPedido(err) {
  const message = String(err?.message || err?.error_description || err?.details || err || '')
    .toLowerCase();

  if (!message) return 'desconocido';

  // Fallas de red (respuesta nunca llegó o fetch falló). En este caso el
  // servidor pudo NO haber registrado el pedido; el reintento es seguro
  // porque el trigger anti-duplicado protege la ventana de 5 minutos.
  if (
    err?.name === 'TypeError'
    || /failed to fetch|network\s?error|network request failed|load failed|aborterror|timeout|timed out/.test(message)
  ) {
    return 'red';
  }

  // Interruptor de pedidos desactivado (validación server-side del RPC).
  if (/temporarily disabled|orders are disabled/.test(message)) {
    return 'deshabilitado';
  }

  // Pedido idéntico reciente (mismo teléfono + nombre + total en 5 min).
  if (/duplicad|duplicate/.test(message) && !/duplicate product/.test(message)) {
    return 'duplicado';
  }

  // Rate limit por teléfono.
  if (/demasiados pedidos|rate limit|too many/.test(message)) {
    return 'limite';
  }

  // Catálogo/inventario: producto inexistente, inactivo o sin stock.
  if (
    /unavailable|exceeds available stock|invalid product|duplicate product|order must contain/.test(message)
  ) {
    return 'inventario';
  }

  // Validaciones de datos del cliente/pedido.
  if (/invalid customer|invalid delivery|invalid order/.test(message)) {
    return 'validacion';
  }

  return 'desconocido';
}
