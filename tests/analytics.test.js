import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProductAnalyticsParams,
  classifyError,
  normalizePublicAnalyticsPath,
  sanitizeAnalyticsParams,
  trackAppError,
  trackCatalogDataRequest,
  trackEvent,
  trackPageView,
} from '../src/utils/analytics.js';

test('removes sensitive and unsupported analytics parameters', () => {
  assert.deepEqual(
    sanitizeAnalyticsParams({
      item_id: ' 42 ',
      result_count: 0,
      has_results: false,
      customer_name: 'Maria',
      telefono: '4521234567',
      nested: { unsafe: true },
    }),
    { item_id: '42', result_count: 0, has_results: false },
  );
});

test('tracks only valid events through an available gtag function', () => {
  const calls = [];
  const target = { gtag: (...args) => calls.push(args) };

  assert.equal(trackEvent('catalog_search', { query_length: 5 }, target), true);
  assert.equal(trackEvent('Invalid Event', {}, target), false);
  assert.deepEqual(calls, [['event', 'catalog_search', { query_length: 5 }]]);
});

test('tracks only normalized public page paths', () => {
  const calls = [];
  const target = { gtag: (...args) => calls.push(args) };

  assert.equal(normalizePublicAnalyticsPath('/catalogo/globos-latex?producto=private'), '/catalogo/globos-latex');
  assert.equal(normalizePublicAnalyticsPath('/admin/clientes'), null);
  assert.equal(normalizePublicAnalyticsPath('/clientes/4521234567'), null);
  assert.equal(trackPageView('/blog/ideas-decoracion-xv-anos', target), true);
  assert.equal(trackPageView('/admin/catalogo', target), false);
  assert.deepEqual(calls, [[
    'event',
    'page_view',
    { page_path: '/blog/ideas-decoracion-xv-anos' },
  ]]);
});

test('builds anonymous product parameters', () => {
  assert.deepEqual(
    buildProductAnalyticsParams({
      id: 7,
      nombre: 'Producto privado',
      categoria: 'Globos',
      marca: 'Glomex',
      precio: '85',
    }, { source: 'catalog' }),
    {
      item_id: '7',
      item_category: 'Globos',
      item_brand: 'Glomex',
      price: 85,
      currency: 'MXN',
      source: 'catalog',
    },
  );
});

test('tracks anonymous catalog data health metrics', () => {
  const calls = [];
  const target = { gtag: (...args) => calls.push(args) };

  assert.equal(trackCatalogDataRequest({
    requestType: 'load_more',
    status: 'success',
    durationMs: 148.7,
    resultCount: 48,
    hasFilters: true,
    usingCache: false,
  }, target), true);
  assert.deepEqual(calls, [[
    'event',
    'catalog_data_request',
    {
      request_type: 'load_more',
      request_status: 'success',
      duration_ms: 149,
      result_count: 48,
      has_filters: true,
      using_cache: false,
    },
  ]]);
});

test('classifies and reports errors without sending their message', () => {
  const calls = [];
  const target = { gtag: (...args) => calls.push(args) };
  const error = new Error('Failed to fetch customer@example.com');

  assert.equal(classifyError(error), 'network');
  assert.equal(trackAppError(error, { context: 'react_boundary', route: '/catalogo' }, target), true);
  assert.deepEqual(calls[0], [
    'event',
    'app_error',
    { error_type: 'network', context: 'react_boundary', route: '/catalogo' },
  ]);
  assert.equal(trackAppError(error, { context: 'window_error' }, target), false);
  assert.equal(calls.length, 1);
});
