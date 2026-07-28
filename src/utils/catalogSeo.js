import { resolveCategoryRoute, slugifyCategory } from './categoryRoutes.js';

const DEFAULT_SITE_NAME = 'Full Party Uruapan';
const DEFAULT_SITE_URL = 'https://www.fullpartyuruapan.com.mx';

const DISPLAY_WORDS = {
  comunion: 'Comunión',
  foil: 'Foil',
  latex: 'Látex',
  led: 'LED',
  mdf: 'MDF',
  numero: 'Número',
};

function humanizeCategorySlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word, index) => {
      if (DISPLAY_WORDS[word]) return DISPLAY_WORDS[word];
      if (index > 0 && ['de', 'para', 'y'].includes(word)) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(' ');
}

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function truncateDescription(value, maxLength = 160) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveImageUrl(value, siteUrl) {
  const image = normalizeText(value);
  if (!image) return '';

  try {
    return new URL(image, siteUrl).toString();
  } catch {
    return '';
  }
}

export function buildCatalogCategoryMeta(
  pathname,
  {
    siteName = DEFAULT_SITE_NAME,
    siteUrl = DEFAULT_SITE_URL,
    category,
  } = {},
) {
  const cleanPath = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '');
  if (!cleanPath.startsWith('/catalogo/')) return null;

  const rawPath = cleanPath.slice('/catalogo/'.length);
  const rawSlug = rawPath.split('/').filter(Boolean).at(-1);
  if (!rawSlug) return null;
  if (rawPath.includes('/') && !normalizeText(category?.canonicalPath)) return null;

  const resolved = resolveCategoryRoute(rawSlug, []);
  const canonicalSlug = resolved?.canonicalSlug || slugifyCategory(rawSlug);
  if (!canonicalSlug) return null;

  const label = normalizeText(category?.label)
    || resolved?.label
    || humanizeCategorySlug(canonicalSlug);
  const canonicalPath = normalizeText(category?.canonicalPath)
    || (rawPath.includes('/') ? rawPath : canonicalSlug);
  const canonical = new URL(`/catalogo/${canonicalPath}`, siteUrl).toString();
  const customDescription = normalizeText(category?.description);
  const description = customDescription
    ? truncateDescription(customDescription)
    : `Compra ${label.toLocaleLowerCase('es-MX')} al mayoreo y menudeo en ${siteName}. Consulta productos, precios y disponibilidad. Envíos a todo México y atención por WhatsApp.`;

  return {
    title: `${label} al Mayoreo en Uruapan | ${siteName}`,
    description,
    canonical,
    breadcrumbLabel: label,
    name: label,
    image: resolveImageUrl(category?.imageUrl, siteUrl),
    count: Number.isInteger(category?.count) ? Math.max(0, category.count) : null,
  };
}
