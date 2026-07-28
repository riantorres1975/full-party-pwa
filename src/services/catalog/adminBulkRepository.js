import { supabase as defaultClient } from '../../lib/supabase.js';
import { classifyCatalogError } from './errors.js';

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export async function applyAdminCommercialRows(
  productId,
  rows,
  { client = defaultClient, batchSize = 25 } = {},
) {
  if (!productId) throw new Error('Selecciona un producto antes de importar.');
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No hay filas validas para procesar.');
  }

  const reports = [];
  for (const batch of chunks(rows, Math.min(50, Math.max(1, batchSize)))) {
    const { data, error } = await client.rpc('catalog_admin_apply_commercial_rows', {
      p_product_id: productId,
      p_rows: batch,
    });
    if (error) {
      throw classifyCatalogError(error, 'No se pudo ejecutar la operacion masiva.');
    }
    reports.push(data);
  }

  const results = reports.flatMap((report) => report?.results ?? []);
  return {
    created: results.filter((row) => row.status === 'created').length,
    updated: results.filter((row) => row.status === 'updated').length,
    rejected: results.filter((row) => row.status === 'rejected').length,
    results,
  };
}
