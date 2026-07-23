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
      .select(PUBLIC_PRODUCT_FIELDS)
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
