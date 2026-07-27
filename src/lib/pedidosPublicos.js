const FOLIO_PATTERN = /^FP-[A-Z0-9-]{4,32}$/;

export function extraerFolioCreado(data) {
  const value = Array.isArray(data)
    ? data[0]?.folio ?? data[0]
    : data?.folio ?? data;
  const folio = typeof value === 'string' ? value.trim().toUpperCase() : '';

  return FOLIO_PATTERN.test(folio) ? folio : null;
}

/**
 * Normaliza la respuesta del RPC crear_pedido_publico.
 * Forma nueva: { folio, total, replay? } — total es el monto canónico del
 * servidor. Forma legacy: 'FP-XXXX' (string) — total queda en null.
 */
export function extraerPedidoCreado(data) {
  const folio = extraerFolioCreado(data);
  if (!folio) return { folio: null, total: null, replay: false };

  const value = Array.isArray(data) ? data[0] : data;
  const rawTotal = value && typeof value === 'object' ? Number(value.total) : NaN;

  return {
    folio,
    total: Number.isFinite(rawTotal) ? rawTotal : null,
    replay: Boolean(value && typeof value === 'object' && value.replay),
  };
}

export async function crearPedidoPublico(client, {
  nombre,
  telefono,
  tipoEntrega,
  direccion,
  total,
  detalles,
  idempotencyKey,
}) {
  const params = {
    p_cliente_nombre: nombre,
    p_cliente_telefono: telefono,
    p_tipo_entrega: tipoEntrega,
    p_direccion: direccion || null,
    p_total: total,
    p_detalles_json: detalles,
  };
  if (idempotencyKey) params.p_idempotency_key = idempotencyKey;

  const { data, error } = await client.rpc('crear_pedido_publico', params);

  if (error) throw error;

  const pedido = extraerPedidoCreado(data);
  if (!pedido.folio) throw new Error('Supabase no devolvio un folio valido.');

  return pedido;
}

export async function buscarPedidoPublico(client, folioInput) {
  const folio = String(folioInput || '').trim().toUpperCase();
  if (!FOLIO_PATTERN.test(folio)) {
    throw new Error('El folio no tiene un formato valido.');
  }

  const { data, error } = await client.rpc('buscar_pedido_por_folio', {
    p_folio: folio,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
