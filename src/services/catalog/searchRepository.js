// ─────────────────────────────────────────────────────────────────────────────
// searchRepository — búsqueda del lado de Supabase (texto normalizado,
// alias, SKU, gama, color, medida) y facetas dinámicas por categoría.
// Fuse.js queda para refinamiento local de conjuntos pequeños (§19).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { adaptCardsResponse, adaptFacets } from './adapters.js';
import { classifyCatalogError } from './errors.js';

/** Búsqueda de tarjetas (máx. `limit`, default 20). */
export async function searchCards(query, { limit = 20, client = defaultClient, signal } = {}) {
  const term = String(query ?? '').trim().slice(0, 80);
  if (!term) return adaptCardsResponse(null);

  let request = client.rpc('catalog_search', { p_query: term, p_limit: limit });
  if (signal && typeof request.abortSignal === 'function') {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;
  if (error) throw classifyCatalogError(error, 'No se pudo completar la búsqueda.');
  return adaptCardsResponse(data);
}

/**
 * Facetas dinámicas del contexto actual (categoría/colección/búsqueda):
 * valores posibles con conteo de resultados por filtro (§18).
 */
export async function getFacets(
  { categorySlug = null, collectionSlug = null, search = null } = {},
  { client = defaultClient, signal } = {},
) {
  let request = client.rpc('catalog_get_facets', {
    p_category_slug: categorySlug,
    p_collection_slug: collectionSlug,
    p_search: search ? String(search).slice(0, 80) : null,
  });
  if (signal && typeof request.abortSignal === 'function') {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;
  if (error) throw classifyCatalogError(error, 'No se pudieron cargar los filtros.');
  return adaptFacets(data);
}
