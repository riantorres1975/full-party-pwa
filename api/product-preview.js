const DEFAULT_SITE_URL = 'https://www.fullpartyuruapan.com.mx';
const DEFAULT_DESCRIPTION = 'Consulta precio y disponibilidad en Full Party Uruapan.';
const PRODUCT_FIELDS = [
  'id',
  'nombre',
  'descripcion',
  'precio',
  'imagen_url',
  'categoria',
  'marca',
  'activo',
  'stock_ilimitado',
  'stock_actual',
].join(',');

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function truncate(value, maxLength = 160) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getSiteOrigin() {
  const configuredUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL;

  try {
    const url = new URL(configuredUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : DEFAULT_SITE_URL;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function getSafeImageUrl(value, siteOrigin) {
  try {
    const imageUrl = new URL(value || '/og-image.jpg', siteOrigin);
    return ['http:', 'https:'].includes(imageUrl.protocol)
      ? imageUrl.toString()
      : `${siteOrigin}/og-image.jpg`;
  } catch {
    return `${siteOrigin}/og-image.jpg`;
  }
}

function getAvailability(product) {
  const unavailable = product?.activo === false || (
    product?.stock_ilimitado === false && Number(product?.stock_actual) <= 0
  );
  return unavailable ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
}

export function buildProductPreviewHtml(product, { siteOrigin = DEFAULT_SITE_URL } = {}) {
  const validProduct = product && product.id !== undefined && product.id !== null;
  const id = validProduct ? String(product.id) : '';
  const name = normalizeText(product?.nombre) || 'Catálogo Full Party';
  const description = truncate(
    normalizeText(product?.descripcion) || (validProduct
      ? `${name}. ${DEFAULT_DESCRIPTION}`
      : 'Explora el catálogo de productos de Full Party Uruapan.'),
  );
  const title = validProduct ? `${name} | Full Party Uruapan` : name;
  const catalogUrl = new URL('/catalogo', siteOrigin);
  if (validProduct) catalogUrl.searchParams.set('producto', id);
  const shareUrl = validProduct
    ? new URL(`/p/${encodeURIComponent(id)}`, siteOrigin).toString()
    : catalogUrl.toString();
  const imageUrl = getSafeImageUrl(product?.imagen_url, siteOrigin);
  const numericPrice = Number(product?.precio);
  const hasPrice = validProduct && product?.precio !== '' && Number.isFinite(numericPrice);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': validProduct ? 'Product' : 'WebPage',
    name,
    description,
    image: imageUrl,
    url: catalogUrl.toString(),
    ...(validProduct && product?.marca ? {
      brand: { '@type': 'Brand', name: normalizeText(product.marca) },
    } : {}),
    ...(hasPrice ? {
      offers: {
        '@type': 'Offer',
        price: numericPrice.toFixed(2),
        priceCurrency: 'MXN',
        availability: getAvailability(product),
        url: catalogUrl.toString(),
      },
    } : {}),
  };
  const safeJson = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
  const redirectUrl = JSON.stringify(catalogUrl.toString()).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(catalogUrl.toString())}">
  <meta property="og:locale" content="es_MX">
  <meta property="og:site_name" content="Full Party Uruapan">
  <meta property="og:type" content="${validProduct ? 'product' : 'website'}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(name)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  ${hasPrice ? `<meta property="product:price:amount" content="${numericPrice.toFixed(2)}">
  <meta property="product:price:currency" content="MXN">` : ''}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(catalogUrl.toString())}">
  <script type="application/ld+json">${safeJson}</script>
</head>
<body>
  <p>Abriendo <a href="${escapeHtml(catalogUrl.toString())}">${escapeHtml(name)}</a>...</p>
  <script>window.location.replace(${redirectUrl});</script>
</body>
</html>`;
}

function getProductId(request) {
  const rawId = Array.isArray(request.query?.id) ? request.query.id[0] : request.query?.id;
  if (typeof rawId !== 'string') return '';
  const id = rawId.trim();
  return /^[a-zA-Z0-9_-]{1,100}$/.test(id) ? id : '';
}

async function fetchProduct(id) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const endpoint = new URL('/rest/v1/productos', supabaseUrl);
  endpoint.searchParams.set('id', `eq.${id}`);
  endpoint.searchParams.set('select', PRODUCT_FIELDS);
  endpoint.searchParams.set('limit', '1');

  const result = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
  });
  if (!result.ok) return null;

  const products = await result.json();
  return Array.isArray(products) ? products[0] || null : null;
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  response.setHeader('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');

  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('Método no permitido');
  }

  const siteOrigin = getSiteOrigin();
  const productId = getProductId(request);
  let product = null;

  if (productId) {
    try {
      product = await fetchProduct(productId);
    } catch {
      product = null;
    }
  }

  if (!product) response.statusCode = 404;
  const html = buildProductPreviewHtml(product, { siteOrigin });
  return request.method === 'HEAD' ? response.end() : response.send(html);
}
