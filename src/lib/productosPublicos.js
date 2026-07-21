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
  { pageSize = PUBLIC_PRODUCTS_PAGE_SIZE, onPage } = {},
) {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0
    ? pageSize
    : PUBLIC_PRODUCTS_PAGE_SIZE;
  const knownIds = new Set();
  let products = [];
  let pageIndex = 0;

  while (true) {
    const from = pageIndex * safePageSize;
    const { data, error } = await client
      .from('productos')
      .select(PUBLIC_PRODUCT_FIELDS)
      .order('activo', { ascending: false })
      .order('nombre', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + safePageSize - 1);

    if (error) return { data: products, error, complete: false };

    const page = Array.isArray(data) ? data : [];
    const previousCount = products.length;
    products = appendUniqueProducts(products, page, knownIds);
    const isLastPage = page.length < safePageSize;

    onPage?.(products, { pageIndex, isLastPage });

    if (isLastPage) return { data: products, error: null, complete: true };

    // Prevent an endless loop if an intermediary ignores the requested range.
    if (products.length === previousCount) {
      return { data: products, error: null, complete: false };
    }

    pageIndex += 1;
  }
}
