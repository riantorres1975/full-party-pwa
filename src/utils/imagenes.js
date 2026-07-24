const SUPABASE_STORAGE_RE = /\/storage\/v1\/object\/public\//;

/**
 * Placeholder inline (data URI SVG) con el nombre del producto.
 * Funciona offline, no depende de terceros y no filtra datos a servicios externos.
 * Usarlo para imágenes renderizadas en la app; para metadatos SEO/JSON-LD
 * (donde un data URI no es válido) usar getProductPlaceholderUrl.
 */
export function getInlineProductPlaceholder(nombre = '') {
  const safeLabel = (String(nombre || 'Producto').trim().slice(0, 40) || 'Producto')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="${safeLabel}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f3e8ff"/><stop offset="100%" stop-color="#e9d5ff"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="150" r="48" fill="#c084fc" fill-opacity="0.35"/><rect x="120" y="220" width="160" height="16" rx="8" fill="#a855f7" fill-opacity="0.28"/><rect x="150" y="248" width="100" height="14" rx="7" fill="#a855f7" fill-opacity="0.22"/><text x="200" y="305" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="18" font-weight="700" fill="#7e22ce">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
