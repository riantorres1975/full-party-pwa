import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATALOG_QUERY_CACHE_KEY,
  CATALOG_QUERY_CACHE_MAX_ENTRIES,
  CATALOG_QUERY_CACHE_MAX_PRODUCTS,
  CATALOG_QUERY_CACHE_TTL_MS,
  readCatalogQueryCache,
  writeCatalogQueryCache,
} from '../src/utils/catalogQueryCache.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('stores and restores a catalog query page', () => {
  const storage = createStorage();
  const now = 1_000;
  const saved = writeCatalogQueryCache(storage, 'globos', {
    data: [{ id: 'a' }, { id: 'b' }],
    totalCount: 20,
    hasMore: true,
  }, now);

  assert.equal(saved, true);
  assert.deepEqual(readCatalogQueryCache(storage, 'globos', now + 500), {
    data: [{ id: 'a' }, { id: 'b' }],
    totalCount: 20,
    hasMore: true,
  });
});

test('expires stale query pages', () => {
  const storage = createStorage();
  writeCatalogQueryCache(storage, 'confeti', {
    data: [{ id: 'c' }],
    totalCount: 1,
    hasMore: false,
  }, 10);

  assert.equal(
    readCatalogQueryCache(storage, 'confeti', 10 + CATALOG_QUERY_CACHE_TTL_MS + 1),
    null,
  );
});

test('limits cached queries and products', () => {
  const storage = createStorage();
  const products = Array.from(
    { length: CATALOG_QUERY_CACHE_MAX_PRODUCTS + 30 },
    (_, index) => ({ id: index }),
  );

  for (let index = 0; index < CATALOG_QUERY_CACHE_MAX_ENTRIES + 3; index += 1) {
    writeCatalogQueryCache(storage, `query-${index}`, {
      data: products,
      totalCount: products.length,
      hasMore: true,
    }, 1_000 + index);
  }

  const entries = JSON.parse(storage.getItem(CATALOG_QUERY_CACHE_KEY));
  assert.equal(entries.length, CATALOG_QUERY_CACHE_MAX_ENTRIES);
  assert.equal(entries[0].key, `query-${CATALOG_QUERY_CACHE_MAX_ENTRIES + 2}`);
  assert.equal(entries[0].data.length, CATALOG_QUERY_CACHE_MAX_PRODUCTS);
  assert.equal(readCatalogQueryCache(storage, 'query-0', 2_000), null);
});
