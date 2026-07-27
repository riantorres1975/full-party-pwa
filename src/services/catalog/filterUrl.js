// ─────────────────────────────────────────────────────────────────────────────
// Estado de filtros del catálogo V2 ↔ URL (query string), lógica PURA.
//
// URLs (§20):
//   /catalogo/globos/latex?marca=glomex&gama=pastel
//   /catalogo/globos/latex?gama=chrome&color=dorado
//   /catalogo/globos/latex?gama=estandar&familiaColor=azul&medida=12-pulgadas
//
// Los valores múltiples se separan por coma dentro del mismo parámetro.
// ─────────────────────────────────────────────────────────────────────────────

export const CATALOG_SORTS = Object.freeze(['featured', 'price_asc', 'price_desc', 'name_asc']);

export const DEFAULT_FILTERS = Object.freeze({
  collectionSlug: null,
  brands: [],
  lines: [],
  colorFamilies: [],
  colors: [],
  sizes: [], // slugs tipo '12-pulgadas' (se resuelven a ids contra las facetas)
  finish: null,
  minPrice: null,
  maxPrice: null,
  inStock: null, // true | false | null
  search: '',
  sort: 'featured',
});

const PARAMS = {
  collectionSlug: 'coleccion',
  brands: 'marca',
  lines: 'gama',
  colorFamilies: 'familiaColor',
  colors: 'color',
  sizes: 'medida',
  finish: 'acabado',
  minPrice: 'min',
  maxPrice: 'max',
  inStock: 'stock',
  search: 'q',
  sort: 'orden',
};

function uniqueList(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((v) => String(v ?? '').trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'es'));
}

function parseList(raw) {
  if (!raw) return [];
  return uniqueList(String(raw).split(','));
}

function parsePrice(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseStock(raw) {
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return null;
}

/** Lee los filtros desde URLSearchParams. */
export function parseFiltersFromSearchParams(searchParams) {
  const get = (key) => searchParams.get(key);
  const sort = get(PARAMS.sort);
  return {
    collectionSlug: get(PARAMS.collectionSlug) || null,
    brands: parseList(get(PARAMS.brands)),
    lines: parseList(get(PARAMS.lines)),
    colorFamilies: parseList(get(PARAMS.colorFamilies)),
    colors: parseList(get(PARAMS.colors)),
    sizes: parseList(get(PARAMS.sizes)),
    finish: get(PARAMS.finish) || null,
    minPrice: parsePrice(get(PARAMS.minPrice)),
    maxPrice: parsePrice(get(PARAMS.maxPrice)),
    inStock: parseStock(get(PARAMS.inStock)),
    search: String(get(PARAMS.search) ?? '').slice(0, 80),
    sort: CATALOG_SORTS.includes(sort) ? sort : 'featured',
  };
}

/** Escribe los filtros a URLSearchParams (omite valores por defecto/vacíos). */
export function serializeFiltersToSearchParams(filters, base) {
  const params = new URLSearchParams(base ?? undefined);
  const setList = (key, values) => {
    if (Array.isArray(values) && values.length > 0) params.set(key, uniqueList(values).join(','));
    else params.delete(key);
  };
  const setValue = (key, value) => {
    if (value != null && value !== '') params.set(key, String(value));
    else params.delete(key);
  };

  setValue(PARAMS.collectionSlug, filters.collectionSlug);
  setList(PARAMS.brands, filters.brands);
  setList(PARAMS.lines, filters.lines);
  setList(PARAMS.colorFamilies, filters.colorFamilies);
  setList(PARAMS.colors, filters.colors);
  setList(PARAMS.sizes, filters.sizes);
  setValue(PARAMS.finish, filters.finish);
  setValue(PARAMS.minPrice, filters.minPrice);
  setValue(PARAMS.maxPrice, filters.maxPrice);
  if (filters.inStock === true) params.set(PARAMS.inStock, '1');
  else if (filters.inStock === false) params.set(PARAMS.inStock, '0');
  else params.delete(PARAMS.inStock);
  setValue(PARAMS.search, filters.search ? String(filters.search).slice(0, 80) : null);
  setValue(PARAMS.sort, filters.sort && filters.sort !== 'featured' ? filters.sort : null);

  return params;
}

/** Alterna un valor dentro de un filtro de selección múltiple. */
export function toggleArrayValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  const v = String(value ?? '').trim();
  if (!v) return current;
  return current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
}

/** ¿El filtro está en su estado por defecto (sin filtros activos)? */
export function hasActiveFilters(filters) {
  return Boolean(
    filters.collectionSlug
    || filters.brands?.length
    || filters.lines?.length
    || filters.colorFamilies?.length
    || filters.colors?.length
    || filters.sizes?.length
    || filters.finish
    || filters.minPrice != null
    || filters.maxPrice != null
    || filters.inStock != null
    || filters.search,
  );
}

/** Número de filtros activos (badge "Filtros (N)" del móvil, §18). */
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.collectionSlug) count += 1;
  count += (filters.brands?.length ?? 0);
  count += (filters.lines?.length ?? 0);
  count += (filters.colorFamilies?.length ?? 0);
  count += (filters.colors?.length ?? 0);
  count += (filters.sizes?.length ?? 0);
  if (filters.finish) count += 1;
  if (filters.minPrice != null || filters.maxPrice != null) count += 1;
  if (filters.inStock != null) count += 1;
  return count;
}

/** Limpia todos los filtros (conserva búsqueda y orden, §18 "Limpiar todos"). */
export function clearAllFilters(filters) {
  return {
    ...DEFAULT_FILTERS,
    search: filters.search ?? '',
    sort: filters.sort ?? 'featured',
    brands: [],
    lines: [],
    colorFamilies: [],
    colors: [],
    sizes: [],
  };
}

/** Slug de medida para URL: '12 pulgadas' → '12-pulgadas'. */
export function sizeNameToSlug(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Resuelve slugs de medida de la URL a ids usando las facetas disponibles. */
export function resolveSizeIds(sizeSlugs, facetSizes) {
  const wanted = new Set((Array.isArray(sizeSlugs) ? sizeSlugs : []).map(sizeNameToSlug));
  if (wanted.size === 0) return [];
  return (Array.isArray(facetSizes) ? facetSizes : [])
    .filter((s) => wanted.has(sizeNameToSlug(s?.name)))
    .map((s) => s.id)
    .filter(Boolean);
}
