// ─────────────────────────────────────────────────────────────────────────────
// Clasificación de errores del catálogo V2 (PURA).
// Convierte errores de PostgREST/red/RPC en tipos estables con mensajes
// amigables en español y bandera de reintentabilidad.
// ─────────────────────────────────────────────────────────────────────────────

export const CATALOG_ERROR_TYPES = Object.freeze({
  OUT_OF_STOCK: 'out_of_stock',
  UNAVAILABLE: 'unavailable',
  INVALID: 'invalid',
  NETWORK: 'network',
  PERMISSION: 'permission',
  ORDERS_DISABLED: 'orders_disabled',
  UNKNOWN: 'unknown',
});

export class CatalogError extends Error {
  constructor(type, message, { cause = null, retryable = false } = {}) {
    super(message);
    this.name = 'CatalogError';
    this.type = type;
    this.cause = cause;
    this.retryable = retryable;
  }
}

/**
 * Clasifica un error crudo (supabase-js, fetch o RPC) en CatalogError.
 * Los RPC del catálogo anteponen códigos a sus mensajes:
 * OUT_OF_STOCK, UNAVAILABLE, INVALID_QUANTITY…
 */
export function classifyCatalogError(error, fallbackMessage = 'No se pudo completar la operación.') {
  const rawMessage = String(error?.message ?? '');
  const code = String(error?.code ?? '');

  if (error instanceof CatalogError) return error;

  if (rawMessage.startsWith('OUT_OF_STOCK')) {
    return new CatalogError(
      CATALOG_ERROR_TYPES.OUT_OF_STOCK,
      rawMessage.replace(/^OUT_OF_STOCK:\s*/, '') || 'Existencia insuficiente.',
      { cause: error },
    );
  }
  if (rawMessage.startsWith('UNAVAILABLE')) {
    return new CatalogError(
      CATALOG_ERROR_TYPES.UNAVAILABLE,
      'Un artículo de tu pedido ya no está disponible.',
      { cause: error },
    );
  }
  if (rawMessage.startsWith('INVALID_QUANTITY')) {
    return new CatalogError(
      CATALOG_ERROR_TYPES.INVALID,
      'La cantidad solicitada no es válida para esta presentación.',
      { cause: error },
    );
  }
  if (rawMessage.includes('Orders are temporarily disabled')) {
    return new CatalogError(
      CATALOG_ERROR_TYPES.ORDERS_DISABLED,
      'Los pedidos están temporalmente deshabilitados. Intenta más tarde.',
      { cause: error, retryable: true },
    );
  }
  if (code === 'ABORT_ERR' || error?.name === 'AbortError') {
    return new CatalogError(CATALOG_ERROR_TYPES.UNKNOWN, 'Consulta cancelada.', { cause: error });
  }
  if (code === 'FETCH_ERROR' || rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
    return new CatalogError(
      CATALOG_ERROR_TYPES.NETWORK,
      'Sin conexión. Revisa tu red e intenta de nuevo.',
      { cause: error, retryable: true },
    );
  }
  if (code === '42501' || rawMessage.includes('permission denied')) {
    return new CatalogError(
      CATALOG_ERROR_TYPES.PERMISSION,
      'No tienes permiso para realizar esta acción.',
      { cause: error },
    );
  }

  return new CatalogError(
    CATALOG_ERROR_TYPES.UNKNOWN,
    rawMessage || fallbackMessage,
    { cause: error, retryable: true },
  );
}
