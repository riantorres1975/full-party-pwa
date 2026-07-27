// ─────────────────────────────────────────────────────────────────────────────
// categoriesRepository — categorías jerárquicas del catálogo V2.
// Lectura directa por tabla (RLS pública: solo activas).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { buildCategoryTree, indexCategoriesBySlug } from './adapters.js';
import { classifyCatalogError } from './errors.js';

const CATEGORY_FIELDS = 'id,name,slug,parent_id,description,image_url,icon,sort_order';

/**
 * Árbol completo de categorías activas, ordenado por sort_order.
 * @returns {Promise<{tree: Array, bySlug: Map<string, object>, flat: Array}>}
 */
export async function listCategoryTree({ client = defaultClient, signal } = {}) {
  let query = client
    .from('catalog_categories')
    .select(CATEGORY_FIELDS)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudieron cargar las categorías.');

  const tree = buildCategoryTree(data);
  return { tree, bySlug: indexCategoriesBySlug(tree), flat: data ?? [] };
}

/**
 * Resuelve una ruta de slugs (/catalogo/globos/latex) al nodo hoja y su ruta
 * completa. Devuelve null si algún tramo no existe.
 * @param {Map<string, object>} bySlug - índice de listCategoryTree
 */
export function resolveCategoryPath(bySlug, slugs) {
  const parts = (Array.isArray(slugs) ? slugs : [slugs]).filter(Boolean);
  if (parts.length === 0 || !(bySlug instanceof Map)) return null;
  const leaf = bySlug.get(parts[parts.length - 1]);
  if (!leaf) return null;
  const expected = leaf.path.join('/');
  return expected === parts.join('/') ? leaf : null;
}
