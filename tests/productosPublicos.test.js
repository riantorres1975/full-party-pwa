import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchAllPublicProducts,
  fetchPublicProductPage,
  PUBLIC_PRODUCT_FIELDS,
  PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
  PUBLIC_PRODUCTS_REFRESH_MAX_LIMIT,
  resolveCatalogRefreshLimit,
} from '../src/lib/productosPublicos.js';

function createClient(pages) {
  const calls = [];

  return {
    calls,
    from(table) {
      const call = { table, fields: '', orders: [], range: [] };
      calls.push(call);

      const query = {
        select(fields) {
          call.fields = fields;
          return query;
        },
        order(field, options) {
          call.orders.push([field, options]);
          return query;
        },
        range(from, to) {
          call.range = [from, to];
          return Promise.resolve(pages[calls.length - 1] ?? { data: [], error: null });
        },
      };

      return query;
    },
  };
}

test('loads every product across as many pages as needed', async () => {
  const client = createClient([
    { data: [{ id: 1 }, { id: 2 }], error: null },
    { data: [{ id: 3 }, { id: 4 }], error: null },
    { data: [{ id: 5 }], error: null },
  ]);
  const seenPages = [];

  const result = await fetchAllPublicProducts(client, {
    pageSize: 2,
    onPage: (products) => seenPages.push(products.map(({ id }) => id)),
  });

  assert.deepEqual(result.data.map(({ id }) => id), [1, 2, 3, 4, 5]);
  assert.equal(result.complete, true);
  assert.equal(result.error, null);
  assert.deepEqual(client.calls.map((call) => call.range), [[0, 1], [2, 3], [4, 5]]);
  assert.deepEqual(seenPages, [[1, 2], [1, 2, 3, 4], [1, 2, 3, 4, 5]]);
});

test('loads a compact initial page before continuing with the full page size', async () => {
  const client = createClient([
    { data: [{ id: 1 }, { id: 2 }], error: null },
    { data: [{ id: 3 }, { id: 4 }, { id: 5 }], error: null },
  ]);
  const pageStates = [];

  const result = await fetchAllPublicProducts(client, {
    initialPageSize: 2,
    pageSize: 5,
    onPage: (products, metadata) => {
      pageStates.push({ ids: products.map(({ id }) => id), ...metadata });
    },
  });

  assert.deepEqual(result.data.map(({ id }) => id), [1, 2, 3, 4, 5]);
  assert.deepEqual(client.calls.map((call) => call.range), [[0, 1], [2, 6]]);
  assert.deepEqual(pageStates, [
    { ids: [1, 2], pageIndex: 0, isLastPage: false },
    { ids: [1, 2, 3, 4, 5], pageIndex: 1, isLastPage: true },
  ]);
});

test('yields between background pages without delaying the completed result', async () => {
  const client = createClient([
    { data: [{ id: 1 }, { id: 2 }], error: null },
    { data: [{ id: 3 }, { id: 4 }], error: null },
    { data: [{ id: 5 }], error: null },
  ]);
  const waits = [];

  const result = await fetchAllPublicProducts(client, {
    initialPageSize: 2,
    pageSize: 2,
    waitBetweenPages: async (metadata) => waits.push(metadata),
  });

  assert.equal(result.complete, true);
  assert.deepEqual(waits, [
    { loadedCount: 2, nextPageIndex: 1 },
    { loadedCount: 4, nextPageIndex: 2 },
  ]);
});

test('can stop after the initial page for lightweight catalog previews', async () => {
  const client = createClient([
    { data: [{ id: 1 }, { id: 2 }], error: null },
    { data: [{ id: 3 }], error: null },
  ]);

  const result = await fetchAllPublicProducts(client, {
    initialPageSize: 2,
    pageSize: 2,
    maxPages: 1,
  });

  assert.deepEqual(result.data.map(({ id }) => id), [1, 2]);
  assert.equal(result.complete, false);
  assert.equal(client.calls.length, 1);
});

test('does not start a request when catalog loading was cancelled', async () => {
  const client = createClient([{ data: [{ id: 1 }], error: null }]);
  const controller = new AbortController();
  controller.abort();

  const result = await fetchAllPublicProducts(client, { signal: controller.signal });

  assert.equal(result.cancelled, true);
  assert.equal(result.complete, false);
  assert.deepEqual(result.data, []);
  assert.equal(client.calls.length, 0);
});

test('uses a stable order and requests only public catalog fields', async () => {
  const client = createClient([{ data: [], error: null }]);

  await fetchAllPublicProducts(client);

  assert.equal(client.calls[0].table, 'productos');
  assert.equal(client.calls[0].fields, PUBLIC_PRODUCT_FIELDS);
  assert.deepEqual(client.calls[0].orders, [
    ['activo', { ascending: false }],
    ['es_nuevo', { ascending: false, nullsFirst: false }],
    ['nombre', { ascending: true }],
    ['id', { ascending: true }],
  ]);
  assert.ok(!PUBLIC_PRODUCT_FIELDS.includes('stock_minimo'));
  assert.ok(!PUBLIC_PRODUCT_FIELDS.includes('familia_mayoreo'));
});

test('preserves pages already loaded if a later request fails', async () => {
  const failure = { code: 'PGRST000', message: 'Network error' };
  const client = createClient([
    { data: [{ id: 'a' }, { id: 'b' }], error: null },
    { data: null, error: failure },
  ]);

  const result = await fetchAllPublicProducts(client, { pageSize: 2 });

  assert.deepEqual(result.data.map(({ id }) => id), ['a', 'b']);
  assert.equal(result.complete, false);
  assert.equal(result.error, failure);
});

test('stops safely if a proxy repeats the same full page', async () => {
  const repeatedPage = { data: [{ id: 1 }, { id: 2 }], error: null };
  const client = createClient([repeatedPage, repeatedPage]);

  const result = await fetchAllPublicProducts(client, { pageSize: 2 });

  assert.deepEqual(result.data.map(({ id }) => id), [1, 2]);
  assert.equal(result.complete, false);
  assert.equal(client.calls.length, 2);
});

test('builds a filtered server-side product page with a stable sort', async () => {
  const calls = [];
  const client = {
    from(table) {
      const call = { table, filters: [], orders: [], select: null, range: null };
      calls.push(call);
      const query = {
        select(fields, options) {
          call.select = [fields, options];
          return query;
        },
        in(field, values) {
          call.filters.push(['in', field, values]);
          return query;
        },
        gte(field, value) {
          call.filters.push(['gte', field, value]);
          return query;
        },
        lte(field, value) {
          call.filters.push(['lte', field, value]);
          return query;
        },
        or(value) {
          call.filters.push(['or', value]);
          return query;
        },
        order(field, options) {
          call.orders.push([field, options]);
          return query;
        },
        range(from, to) {
          call.range = [from, to];
          return Promise.resolve({
            data: [{ id: 'p-1' }],
            error: null,
            count: 53,
          });
        },
      };
      return query;
    },
  };

  const result = await fetchPublicProductPage(client, {
    offset: 48,
    limit: 24,
    filters: {
      search: ' globo, azul ',
      categories: ['Globo Latex'],
      brands: ['Glomex'],
      sizes: ['12 Pulg'],
      minPrice: 20,
      maxPrice: 100,
    },
    sortOrder: 'price-desc',
  });

  assert.equal(result.count, 53);
  assert.equal(result.hasMore, true);
  assert.deepEqual(calls[0].select, [PUBLIC_PRODUCT_FIELDS, { count: 'exact' }]);
  assert.deepEqual(calls[0].filters, [
    ['in', 'categoria', ['Globo Latex']],
    ['in', 'marca', ['Glomex']],
    ['in', 'tamano', ['12 Pulg']],
    ['gte', 'precio', 20],
    ['lte', 'precio', 100],
    ['or', 'nombre.ilike.*globo*azul*,descripcion.ilike.*globo*azul*,categoria.ilike.*globo*azul*,marca.ilike.*globo*azul*,tamano.ilike.*globo*azul*'],
  ]);
  assert.deepEqual(calls[0].orders, [
    ['precio', { ascending: false }],
    ['id', { ascending: true }],
  ]);
  assert.deepEqual(calls[0].range, [48, 71]);
});

test('refresh limit keeps already loaded products instead of collapsing to the first page', () => {
  // Sin productos cargados: página inicial compacta.
  assert.equal(resolveCatalogRefreshLimit(0), PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE);
  assert.equal(resolveCatalogRefreshLimit(undefined), PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE);
  assert.equal(resolveCatalogRefreshLimit(-5), PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE);

  // Menos de una página cargada: sigue siendo la página inicial.
  assert.equal(resolveCatalogRefreshLimit(10), PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE);

  // Con scroll infinito activo: el refresh cubre todo lo cargado (una sola petición).
  assert.equal(resolveCatalogRefreshLimit(48), 48);
  assert.equal(resolveCatalogRefreshLimit(248), 248);
  assert.equal(resolveCatalogRefreshLimit(448), 448);

  // Tope de seguridad para no pedir de más.
  assert.equal(resolveCatalogRefreshLimit(5000), PUBLIC_PRODUCTS_REFRESH_MAX_LIMIT);

  // Opciones defensivas.
  assert.equal(resolveCatalogRefreshLimit(100, { initialPageSize: 24 }), 100);
  assert.equal(resolveCatalogRefreshLimit(100, { maxLimit: 80 }), 80);
  assert.equal(resolveCatalogRefreshLimit(0, { initialPageSize: -1 }), PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE);
});
