import { SUCURSALES } from '../data/sucursales.js';
import { buildCatalogCategoryMeta } from './catalogSeo.js';

const DEFAULT_SITE_NAME = 'Full Party Uruapan';
const DEFAULT_SITE_URL = 'https://www.fullpartyuruapan.com.mx';

const PUBLIC_PAGE_LABELS = {
  '/catalogo': 'Catálogo',
  '/sucursales': 'Sucursales',
  '/como-funciona': 'Cómo hacer un pedido',
  '/destacados': 'Categorías destacadas',
  '/blog': 'Blog',
};

function cleanPathname(pathname) {
  const cleanPath = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return cleanPath || '/';
}

function absoluteUrl(pathname, siteUrl) {
  return new URL(pathname, siteUrl).toString();
}

function buildBreadcrumbList(pathname, { siteName, siteUrl }) {
  const path = cleanPathname(pathname);
  if (path === '/' || path.startsWith('/admin')) return null;

  let entries = null;
  if (PUBLIC_PAGE_LABELS[path]) {
    entries = [
      { name: siteName, path: '/' },
      { name: PUBLIC_PAGE_LABELS[path], path },
    ];
  } else {
    const categoryMeta = buildCatalogCategoryMeta(path, { siteName, siteUrl });
    if (categoryMeta) {
      const canonicalPath = new URL(categoryMeta.canonical).pathname;
      entries = [
        { name: siteName, path: '/' },
        { name: 'Catálogo', path: '/catalogo' },
        { name: categoryMeta.breadcrumbLabel, path: canonicalPath },
      ];
    }
  }

  if (!entries) return null;

  return {
    '@type': 'BreadcrumbList',
    itemListElement: entries.map(({ name, path: entryPath }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: absoluteUrl(entryPath, siteUrl),
    })),
  };
}

function buildBranchStore(branch, siteUrl) {
  return {
    '@type': 'Store',
    '@id': `${siteUrl}/sucursales#${branch.id}`,
    name: branch.nombreCompleto,
    url: `${siteUrl}/sucursales#${branch.id}`,
    image: `${siteUrl}/og-image.jpg`,
    telephone: branch.telefonoE164,
    priceRange: '$$',
    currenciesAccepted: 'MXN',
    branchOf: { '@id': `${siteUrl}/#localbusiness` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.calle,
      addressLocality: 'Uruapan',
      addressRegion: 'Michoacán',
      postalCode: branch.cp,
      addressCountry: 'MX',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: branch.latitude,
      longitude: branch.longitude,
    },
    hasMap: branch.mapsUrl,
    openingHoursSpecification: branch.openingHours.map(({ days, opens, closes }) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days,
      opens,
      closes,
    })),
  };
}

export function buildRouteStructuredData(
  pathname,
  { siteName = DEFAULT_SITE_NAME, siteUrl = DEFAULT_SITE_URL } = {},
) {
  const path = cleanPathname(pathname);
  const graph = [];
  const breadcrumb = buildBreadcrumbList(path, { siteName, siteUrl });
  if (breadcrumb) graph.push(breadcrumb);

  if (path === '/sucursales') {
    graph.push(...SUCURSALES.map((branch) => buildBranchStore(branch, siteUrl)));
  }

  if (graph.length === 0) return null;
  return { '@context': 'https://schema.org', '@graph': graph };
}
