// ─────────────────────────────────────────────────────────────────────────────
// variantsRepository — lectura de variantes individuales (deep links,
// validaciones puntuales). Para el detalle completo usar
// productsRepository.getProductDetail.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { adaptVariant } from './adapters.js';
import { classifyCatalogError } from './errors.js';

const VARIANT_SELECT = `
  id, product_id, line_id, color_id, size_id, finish, sku, barcode, image_url,
  inventory_policy, active,
  line:catalog_product_lines(name, slug, finish_type),
  color:catalog_colors(exact_name, slug, hex_value, internal_code),
  size:catalog_sizes(name, numeric_value, unit),
  presentations:catalog_sale_presentations(
    id, name, presentation_type, base_unit,
    contained_quantity, contained_unit,
    contains_presentation_id, contains_quantity, base_units_total,
    base_price, compare_at_price, sku, barcode,
    minimum_order_quantity, quantity_step, maximum_order_quantity,
    inventory_policy, sort_order, active,
    tiers:catalog_price_tiers(
      minimum_quantity, maximum_quantity, price_per_presentation, label, active
    )
  )
`;

function flattenVariant(row) {
  if (!row) return null;
  return adaptVariant({
    ...row,
    line_name: row.line?.name ?? null,
    line_slug: row.line?.slug ?? null,
    finish_type: row.line?.finish_type ?? null,
    color_name: row.color?.exact_name ?? null,
    color_slug: row.color?.slug ?? null,
    color_hex: row.color?.hex_value ?? null,
    color_code: row.color?.internal_code ?? null,
    size_name: row.size?.name ?? null,
    size_numeric: row.size?.numeric_value ?? null,
    size_unit: row.size?.unit ?? null,
    presentations: (Array.isArray(row.presentations) ? row.presentations : [])
      .filter((p) => p.active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => ({
        ...p,
        tiers: (Array.isArray(p.tiers) ? p.tiers : [])
          .filter((t) => t.active !== false)
          .sort((a, b) => a.minimum_quantity - b.minimum_quantity),
      })),
  });
}

/** Variante activa por id con presentaciones y escalones (null si no existe). */
export async function getVariantById(variantId, { client = defaultClient, signal } = {}) {
  if (!variantId) return null;

  let query = client
    .from('catalog_variants')
    .select(VARIANT_SELECT)
    .eq('id', variantId)
    .eq('active', true)
    .maybeSingle();

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar la variante.');
  return flattenVariant(data);
}

/** Variante activa por SKU (para escáner de códigos / deep links). */
export async function getVariantBySku(sku, { client = defaultClient, signal } = {}) {
  const safeSku = String(sku ?? '').trim();
  if (!safeSku) return null;

  let query = client
    .from('catalog_variants')
    .select(VARIANT_SELECT)
    .eq('sku', safeSku)
    .eq('active', true)
    .maybeSingle();

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar la variante.');
  return flattenVariant(data);
}
