const FOLIO_PATTERN = /^FP-[A-Z0-9-]{4,32}$/;

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
