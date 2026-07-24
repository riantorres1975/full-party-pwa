export const PUBLIC_PRODUCT_FIELDS = [
  'id',
  'nombre',
  'descripcion',
  'precio',
  'imagen_url',
  'categoria',
  'marca',
  'tamano',
  'activo',
  'stock_ilimitado',
  'stock_actual',
  'es_nuevo',
  'precios_mayoreo',
].join(',');

export const PUBLIC_PRODUCTS_PAGE_SIZE = 200;
export const PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE = 48;
export const PUBLIC_PRODUCTS_REFRESH_MAX_LIMIT = 1000;
export const PUBLIC_CATALOG_FACET_FIELDS = 'dimension,valor,cantidad,precio_min,precio_max,imagen';

/**
 * Límite para refrescar la consulta activa del catálogo (evento Realtime o
 * reintento manual). Si el usuario ya cargó N productos se vuelven a pedir
 * esos N desde offset 0 en una sola petición: los datos se actualizan sin
 * colapsar la lista a la primera página ni obligar a hacer scroll de nuevo.
 */
export function resolveCatalogRefreshLimit(
  loadedCount,
  {
    initialPageSize = PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
    maxLimit = PUBLIC_PRODUCTS_REFRESH_MAX_LIMIT,
  } = {},
) {
  const safeInitial = Number.isInteger(initialPageSize) && initialPageSize > 0
    ? initialPageSize
    : PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE;
  const safeMax = Number.isInteger(maxLimit) && maxLimit >= safeInitial
    ? maxLimit
    : safeInitial;
  const safeLoaded = Number.isInteger(loadedCount) && loadedCount > 0 ? loadedCount : 0;
  return Math.min(Math.max(safeInitial, safeLoaded), safeMax);
}

const PRODUCT_SORTS = {
  featured: [
    ['activo', { ascending: false }],
    ['es_nuevo', { ascending: false, nullsFirst: false }],
    ['nombre', { ascending: true }],
    ['id', { ascending: true }],
  ],
  'name-asc': [
    ['nombre', { ascending: true }],
    ['id', { ascending: true }],
  ],
  'price-asc': [
    ['precio', { ascending: true }],
    ['id', { ascending: true }],
  ],
  'price-desc': [
    ['precio', { ascending: false }],
    ['id', { ascending: true }],
  ],
};

function uniqueNonEmpty(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  )];
}

function sanitizeSearchTerm(value) {
  return String(value ?? '')
    .trim()
    .replace(/[(),.*:%]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function applyCatalogFilters(query, {
  search,
  categories,
  brands,
  sizes,
  minPrice,
  maxPrice,
  ids,
} = {}) {
  const safeCategories = uniqueNonEmpty(categories);
  const safeBrands = uniqueNonEmpty(brands);
  const safeSizes = uniqueNonEmpty(sizes);
  const safeIds = uniqueNonEmpty(ids);
  const safeSearch = sanitizeSearchTerm(search);

  if (safeIds.length > 0) query = query.in('id', safeIds);
  if (safeCategories.length > 0) query = query.in('categoria', safeCategories);
  if (safeBrands.length > 0) query = query.in('marca', safeBrands);
  if (safeSizes.length > 0) query = query.in('tamano', safeSizes);
  if (Number.isFinite(minPrice)) query = query.gte('precio', minPrice);
  if (Number.isFinite(maxPrice)) query = query.lte('precio', maxPrice);

  if (safeSearch) {
    const pattern = `*${safeSearch.replace(/\s+/g, '*')}*`;
    query = query.or([
      `nombre.ilike.${pattern}`,
      `descripcion.ilike.${pattern}`,
      `categoria.ilike.${pattern}`,
      `marca.ilike.${pattern}`,
      `tamano.ilike.${pattern}`,
    ].join(','));
  }

  return query;
}

export async function fetchPublicProductPage(
  client,
  {
    offset = 0,
    limit = PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
    filters,
    sortOrder = 'featured',
    includeCount = true,
    signal,
  } = {},
) {
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  const safeLimit = Number.isInteger(limit) && limit > 0
    ? limit
    : PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE;
  const sort = PRODUCT_SORTS[sortOrder] || PRODUCT_SORTS.featured;
  let query = client
    .from('productos')
    .select(PUBLIC_PRODUCT_FIELDS, includeCount ? { count: 'exact' } : undefined);

  query = applyCatalogFilters(query, filters);
  sort.forEach(([field, options]) => {
    query = query.order(field, options);
  });

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const result = await query.range(safeOffset, safeOffset + safeLimit - 1);
  const data = Array.isArray(result.data) ? result.data : [];
  const count = Number.isInteger(result.count) ? result.count : null;

  return {
    ...result,
    data,
    count,
    hasMore: count === null
      ? data.length === safeLimit
      : safeOffset + data.length < count,
  };
}

export async function fetchPublicCatalogFacets(client, { signal } = {}) {
  let query = client
    .from('catalogo_facetas_publicas')
    .select(PUBLIC_CATALOG_FACET_FIELDS);

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  return query.range(0, 999);
}

function appendUniqueProducts(current, page, knownIds) {
  const next = [...current];

  page.forEach((product) => {
    const id = String(product?.id ?? '');
    if (!id || knownIds.has(id)) return;
    knownIds.add(id);
    next.push(product);
  });

  return next;
}

export async function fetchAllPublicProducts(
  client,
  {
    fields = PUBLIC_PRODUCT_FIELDS,
    pageSize = PUBLIC_PRODUCTS_PAGE_SIZE,
    initialPageSize = PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
    maxPages = Number.POSITIVE_INFINITY,
    onPage,
    signal,
    waitBetweenPages,
  } = {},
) {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0
    ? pageSize
    : PUBLIC_PRODUCTS_PAGE_SIZE;
  const safeInitialPageSize = Number.isInteger(initialPageSize) && initialPageSize > 0
    ? Math.min(initialPageSize, safePageSize)
    : Math.min(PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE, safePageSize);
  const safeMaxPages = Number.isInteger(maxPages) && maxPages > 0
    ? maxPages
    : Number.POSITIVE_INFINITY;
  const knownIds = new Set();
  let products = [];
  let pageIndex = 0;
  let from = 0;

  while (true) {
    if (signal?.aborted) {
      return { data: products, error: null, complete: false, cancelled: true };
    }

    const requestSize = pageIndex === 0 ? safeInitialPageSize : safePageSize;
    let query = client
      .from('productos')
      .select(fields)
      .order('activo', { ascending: false })
      .order('es_nuevo', { ascending: false, nullsFirst: false })
      .order('nombre', { ascending: true })
      .order('id', { ascending: true });

    if (signal && typeof query.abortSignal === 'function') {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query.range(from, from + requestSize - 1);

    if (signal?.aborted) {
      return { data: products, error: null, complete: false, cancelled: true };
    }

    if (error) return { data: products, error, complete: false, cancelled: false };

    const page = Array.isArray(data) ? data : [];
    const previousCount = products.length;
    products = appendUniqueProducts(products, page, knownIds);
    const isLastPage = page.length < requestSize;

    onPage?.(products, { pageIndex, isLastPage });

    if (isLastPage) {
      return { data: products, error: null, complete: true, cancelled: false };
    }

    // Prevent an endless loop if an intermediary ignores the requested range.
    if (products.length === previousCount) {
      return { data: products, error: null, complete: false, cancelled: false };
    }

    if (pageIndex + 1 >= safeMaxPages) {
      return { data: products, error: null, complete: false, cancelled: false };
    }

    if (typeof waitBetweenPages === 'function') {
      await waitBetweenPages({
        loadedCount: products.length,
        nextPageIndex: pageIndex + 1,
      });
    }

    from += requestSize;
    pageIndex += 1;
  }
}
