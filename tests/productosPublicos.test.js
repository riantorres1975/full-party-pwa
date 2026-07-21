import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchAllPublicProducts,
  PUBLIC_PRODUCT_FIELDS,
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

test('uses a stable order and requests only public catalog fields', async () => {
  const client = createClient([{ data: [], error: null }]);

  await fetchAllPublicProducts(client);

  assert.equal(client.calls[0].table, 'productos');
  assert.equal(client.calls[0].fields, PUBLIC_PRODUCT_FIELDS);
  assert.deepEqual(client.calls[0].orders, [
    ['activo', { ascending: false }],
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
