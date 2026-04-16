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
 * Reservado para cuando se active el plan Pro de Supabase (Image Transformations).
 * Por ahora devuelve la URL original sin modificar.
 */
export function getSupabaseImageUrl(url) {
  const cleanUrl = typeof url === 'string' ? url.trim() : '';
  return cleanUrl;
}
