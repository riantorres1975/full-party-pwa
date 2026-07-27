// ─────────────────────────────────────────────────────────────────────────────
// collectionsRepository — colecciones del catálogo V2 (eventos, colores,
// editoriales) con ventana temporal start_date/end_date.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { isCollectionCurrent } from './collectionWindow.js';
import { classifyCatalogError } from './errors.js';

const COLLECTION_FIELDS =
  'id,name,slug,description,collection_type,image_url,start_date,end_date,sort_order,active';

/**
 * Colecciones activas. Con `onlyCurrent` (default) solo las vigentes hoy.
 */
export async function listCollections(
  { onlyCurrent = true } = {},
  { client = defaultClient, signal } = {},
) {
  let query = client
    .from('catalog_collections')
    .select(COLLECTION_FIELDS)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudieron cargar las colecciones.');

  const all = Array.isArray(data) ? data : [];
  return onlyCurrent ? all.filter((c) => isCollectionCurrent(c)) : all;
}

/** Una colección por slug (null si no existe, inactiva o fuera de ventana). */
export async function getCollectionBySlug(slug, { client = defaultClient, signal } = {}) {
  if (!slug) return null;

  let query = client
    .from('catalog_collections')
    .select(COLLECTION_FIELDS)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar la colección.');
  return data && isCollectionCurrent(data) ? data : null;
}
