// ─────────────────────────────────────────────────────────────────────────────
// presentationsRepository — presentaciones de venta individuales:
// lectura puntual y contenido anidado resuelto (caja → bolsas → piezas).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { adaptPresentation } from './adapters.js';
import { classifyCatalogError } from './errors.js';

const PRESENTATION_FIELDS = `
  id, variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit,
  contains_presentation_id, contains_quantity, base_units_total,
  base_price, compare_at_price, sku, barcode,
  minimum_order_quantity, quantity_step, maximum_order_quantity,
  inventory_policy, sort_order, active,
  tiers:catalog_price_tiers(
    minimum_quantity, maximum_quantity, price_per_presentation, label, active
  )
`;

function flatten(row) {
  if (!row) return null;
  return adaptPresentation({
    ...row,
    tiers: (Array.isArray(row.tiers) ? row.tiers : [])
      .filter((t) => t.active !== false)
      .sort((a, b) => a.minimum_quantity - b.minimum_quantity),
  });
}

/** Presentación activa por id con sus escalones (null si no existe). */
export async function getPresentationById(id, { client = defaultClient, signal } = {}) {
  if (!id) return null;

  let query = client
    .from('catalog_sale_presentations')
    .select(PRESENTATION_FIELDS)
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar la presentación.');
  return flatten(data);
}

/**
 * Cadena de contenido anidado de una presentación, de afuera hacia adentro:
 * [caja, bolsa] — máx. 5 niveles (tope del esquema). Sirve para mostrar
 * "Caja de 12 bolsas · cada bolsa 100 globos · 1,200 en total" (§16).
 */
export async function getPresentationChain(id, { client = defaultClient, signal } = {}) {
  const chain = [];
  let current = await getPresentationById(id, { client, signal });
  let depth = 0;

  while (current && depth < 5) {
    chain.push(current);
    if (!current.containsPresentationId) break;
    current = await getPresentationById(current.containsPresentationId, { client, signal });
    depth += 1;
  }

  return chain;
}

/**
 * Descripción legible del contenido: "12 bolsas × 100 piezas = 1,200 piezas".
 * @param {Array} chain - resultado de getPresentationChain
 */
export function describePresentationChain(chain) {
  const list = Array.isArray(chain) ? chain : [];
  if (list.length === 0) return '';
  const outer = list[0];
  if (list.length === 1) {
    return `${outer.containedQuantity ?? outer.baseUnitsTotal} ${outer.containedUnit ?? outer.baseUnit}${(outer.containedQuantity ?? 0) === 1 ? '' : 's'} por ${outer.presentationType}`;
  }
  const inner = list[list.length - 1];
  return `${outer.name} · ${inner.containedQuantity ?? ''} ${inner.containedUnit ?? inner.baseUnit} c/u · ${outer.baseUnitsTotal} ${outer.baseUnit} en total`;
}
