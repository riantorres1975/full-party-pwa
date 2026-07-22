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

export const PUBLIC_PRODUCTS_PAGE_SIZE = 500;
export const PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE = 48;

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
    pageSize = PUBLIC_PRODUCTS_PAGE_SIZE,
    initialPageSize = PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
    onPage,
  } = {},
) {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0
    ? pageSize
    : PUBLIC_PRODUCTS_PAGE_SIZE;
  const safeInitialPageSize = Number.isInteger(initialPageSize) && initialPageSize > 0
    ? Math.min(initialPageSize, safePageSize)
    : Math.min(PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE, safePageSize);
  const knownIds = new Set();
  let products = [];
  let pageIndex = 0;
  let from = 0;

  while (true) {
    const requestSize = pageIndex === 0 ? safeInitialPageSize : safePageSize;
    const { data, error } = await client
      .from('productos')
      .select(PUBLIC_PRODUCT_FIELDS)
      .order('activo', { ascending: false })
      .order('es_nuevo', { ascending: false, nullsFirst: false })
      .order('nombre', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + requestSize - 1);

    if (error) return { data: products, error, complete: false };

    const page = Array.isArray(data) ? data : [];
    const previousCount = products.length;
    products = appendUniqueProducts(products, page, knownIds);
    const isLastPage = page.length < requestSize;

    onPage?.(products, { pageIndex, isLastPage });

    if (isLastPage) return { data: products, error: null, complete: true };

    // Prevent an endless loop if an intermediary ignores the requested range.
    if (products.length === previousCount) {
      return { data: products, error: null, complete: false };
    }

    from += requestSize;
    pageIndex += 1;
  }
}
