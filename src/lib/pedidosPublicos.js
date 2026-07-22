const FOLIO_PATTERN = /^FP-[A-Z0-9-]{4,32}$/;

export function extraerFolioCreado(data) {
  const value = Array.isArray(data)
    ? data[0]?.folio ?? data[0]
    : data?.folio ?? data;
  const folio = typeof value === 'string' ? value.trim().toUpperCase() : '';

  return FOLIO_PATTERN.test(folio) ? folio : null;
}

export async function crearPedidoPublico(client, {
  nombre,
  telefono,
  tipoEntrega,
  direccion,
  total,
  detalles,
}) {
  const { data, error } = await client.rpc('crear_pedido_publico', {
    p_cliente_nombre: nombre,
    p_cliente_telefono: telefono,
    p_tipo_entrega: tipoEntrega,
    p_direccion: direccion || null,
    p_total: total,
    p_detalles_json: detalles,
  });

  if (error) throw error;

  const folio = extraerFolioCreado(data);
  if (!folio) throw new Error('Supabase no devolvio un folio valido.');

  return folio;
}
