export function getProductPlaceholderUrl(nombre = '', size = '900x900') {
  const label = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Producto';
  return `https://placehold.co/${size}/f3e8ff/a855f7?text=${encodeURIComponent(label)}`;
}

export function getSafeProductImageUrl(url, nombre = '', size = '900x900') {
  const cleanUrl = typeof url === 'string' ? url.trim() : '';
  if (cleanUrl) return cleanUrl;
  return getProductPlaceholderUrl(nombre, size);
}
