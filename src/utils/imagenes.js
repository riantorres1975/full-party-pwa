const SUPABASE_STORAGE_RE = /\/storage\/v1\/object\/public\//;

export function getProductPlaceholderUrl(nombre = '', size = '900x900') {
  const label = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Producto';
  return `https://placehold.co/${size}/f3e8ff/a855f7?text=${encodeURIComponent(label)}`;
}

export function getSafeProductImageUrl(url, nombre = '', size = '900x900') {
  const cleanUrl = typeof url === 'string' ? url.trim() : '';
  if (cleanUrl) return cleanUrl;
  return getProductPlaceholderUrl(nombre, size);
}

/**
 * Añade parámetros de transformación a URLs de Supabase Storage.
 * Para URLs externas (no Supabase) devuelve la URL sin cambios.
 */
export function getSupabaseImageUrl(url, { width = 400, quality = 80 } = {}) {
  const cleanUrl = typeof url === 'string' ? url.trim() : '';
  if (!cleanUrl || !SUPABASE_STORAGE_RE.test(cleanUrl)) return cleanUrl;
  const base = cleanUrl.split('?')[0];
  return `${base}?width=${width}&format=webp&quality=${quality}`;
}
