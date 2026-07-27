// ─────────────────────────────────────────────────────────────────────────────
// productsRepository — lectura pública del catálogo V2 vía RPC.
// Tarjetas agrupadas (producto/gama) y detalle completo del producto.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { adaptCardsResponse, adaptProductDetail } from './adapters.js';
import { classifyCatalogError } from './errors.js';

function listOrNull(values) {
  return Array.isArray(values) && values.length > 0 ? values : null;
}

/**
 * Tarjetas del catálogo con filtros, orden y paginación por offset.
 * @param {object} filters - estado de filtros (ver filterUrl.js) + sizeIds resueltos
 * @returns {Promise<{cards: Array, total: number, limit: number, offset: number}>}
 */
export async function listCards(filters = {}, { client = defaultClient, signal } = {}) {
  const params = {
    p_category_slug: filters.categorySlug ?? null,
    p_collection_slug: filters.collectionSlug ?? null,
    p_brand_slugs: listOrNull(filters.brands),
    p_line_slugs: listOrNull(filters.lines),
    p_color_family_slugs: listOrNull(filters.colorFamilies),
    p_color_slugs: listOrNull(filters.colors),
    p_size_ids: listOrNull(filters.sizeIds),
    p_finish: filters.finish ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_in_stock: filters.inStock ?? null,
    p_search: filters.search ? String(filters.search).slice(0, 80) : null,
    p_sort: filters.sort ?? 'featured',
    p_limit: Number.isInteger(filters.limit) ? filters.limit : 24,
    p_offset: Number.isInteger(filters.offset) ? filters.offset : 0,
  };

  let query = client.rpc('catalog_list_cards', params);
  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar el catálogo.');
  return adaptCardsResponse(data);
}

/**
 * Detalle completo del producto: variantes válidas, presentaciones,
 * escalones, disponibilidad, imágenes, atributos y relacionados.
 * @returns {Promise<object|null>} null si el slug no existe o está inactivo
 */
export async function getProductDetail(slug, { client = defaultClient, signal } = {}) {
  if (!slug) return null;

  let query = client.rpc('catalog_get_product_detail', { p_slug: slug });
  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar el producto.');
  return adaptProductDetail(data);
}
