const SITE_NAME = 'Full Party Uruapan';
const DEFAULT_DESCRIPTION = 'Consulta precio y disponibilidad en Full Party Uruapan.';

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function truncateDescription(value, maxLength = 160) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

export function buildProductSeo(product, { pageUrl, imageUrl } = {}) {
  const name = normalizeText(product?.nombre) || 'Producto';
  const productDescription = normalizeText(product?.descripcion);
  const description = truncateDescription(
    productDescription || `${name}. ${DEFAULT_DESCRIPTION}`,
  );
  const canonicalUrl = new URL('/catalogo', pageUrl || 'https://fullpartyuruapan.com.mx');

  if (product?.id !== undefined && product?.id !== null) {
    canonicalUrl.searchParams.set('producto', String(product.id));
  }

  return {
    title: `${name} | ${SITE_NAME}`,
    description,
    canonicalUrl: canonicalUrl.toString(),
    imageUrl: imageUrl ? new URL(imageUrl, canonicalUrl.origin).toString() : '',
    price: product?.precio !== null &&
      product?.precio !== undefined &&
      product?.precio !== '' &&
      Number.isFinite(Number(product.precio))
      ? Number(product.precio).toFixed(2)
      : '',
  };
}

export function buildProductShareUrl(productId, pageUrl) {
  const url = new URL(pageUrl || 'https://www.fullpartyuruapan.com.mx');
  url.pathname = `/p/${encodeURIComponent(String(productId))}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function updateMeta(documentRef, selector, attributes, content) {
  let element = documentRef.head.querySelector(selector);
  const created = !element;

  if (!element) {
    element = documentRef.createElement('meta');
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    documentRef.head.appendChild(element);
  }

  const previousContent = element.getAttribute('content');
  element.setAttribute('content', content);

  return () => {
    if (created) {
      element.remove();
    } else if (previousContent === null) {
      element.removeAttribute('content');
    } else {
      element.setAttribute('content', previousContent);
    }
  };
}

function updateCanonical(documentRef, url) {
  let element = documentRef.head.querySelector('link[rel="canonical"]');
  const created = !element;

  if (!element) {
    element = documentRef.createElement('link');
    element.setAttribute('rel', 'canonical');
    documentRef.head.appendChild(element);
  }

  const previousHref = element.getAttribute('href');
  element.setAttribute('href', url);

  return () => {
    if (created) {
      element.remove();
    } else if (previousHref === null) {
      element.removeAttribute('href');
    } else {
      element.setAttribute('href', previousHref);
    }
  };
}

export function applyProductSeo(documentRef, metadata) {
  const previousTitle = documentRef.title;
  const restore = [
    updateCanonical(documentRef, metadata.canonicalUrl),
    updateMeta(documentRef, 'meta[name="description"]', { name: 'description' }, metadata.description),
    updateMeta(documentRef, 'meta[property="og:type"]', { property: 'og:type' }, 'product'),
    updateMeta(documentRef, 'meta[property="og:title"]', { property: 'og:title' }, metadata.title),
    updateMeta(documentRef, 'meta[property="og:description"]', { property: 'og:description' }, metadata.description),
    updateMeta(documentRef, 'meta[property="og:url"]', { property: 'og:url' }, metadata.canonicalUrl),
    updateMeta(documentRef, 'meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image'),
    updateMeta(documentRef, 'meta[name="twitter:title"]', { name: 'twitter:title' }, metadata.title),
    updateMeta(documentRef, 'meta[name="twitter:description"]', { name: 'twitter:description' }, metadata.description),
  ];

  if (metadata.imageUrl) {
    restore.push(
      updateMeta(documentRef, 'meta[property="og:image"]', { property: 'og:image' }, metadata.imageUrl),
      updateMeta(documentRef, 'meta[name="twitter:image"]', { name: 'twitter:image' }, metadata.imageUrl),
    );
  }

  if (metadata.price) {
    restore.push(
      updateMeta(documentRef, 'meta[property="product:price:amount"]', { property: 'product:price:amount' }, metadata.price),
      updateMeta(documentRef, 'meta[property="product:price:currency"]', { property: 'product:price:currency' }, 'MXN'),
    );
  }

  documentRef.title = metadata.title;

  return () => {
    documentRef.title = previousTitle;
    restore.reverse().forEach((restoreMetadata) => restoreMetadata());
  };
}
