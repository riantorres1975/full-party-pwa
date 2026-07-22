import assert from 'node:assert/strict';
import test from 'node:test';
import { getCatalogPagePlan } from '../src/hooks/useInfiniteScroll.js';

test('sizes catalog batches for each responsive layout', () => {
  assert.deepEqual(getCatalogPagePlan(390), { initial: 6, batch: 8 });
  assert.deepEqual(getCatalogPagePlan(768), { initial: 12, batch: 12 });
  assert.deepEqual(getCatalogPagePlan(1280), { initial: 12, batch: 20 });
  assert.deepEqual(getCatalogPagePlan(1920), { initial: 16, batch: 28 });
});

test('uses a safe desktop plan when width is unavailable', () => {
  assert.deepEqual(getCatalogPagePlan(Number.NaN), { initial: 12, batch: 20 });
});
