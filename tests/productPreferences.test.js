import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeProductIds,
  updateRecentProductIds,
} from '../src/hooks/useProductPreferences.js';

test('normalizes stored product IDs and removes duplicates', () => {
  assert.deepEqual(
    normalizeProductIds([' 1 ', 2, '1', null, '', 3]),
    ['1', '2', '3'],
  );
  assert.deepEqual(normalizeProductIds('invalid'), []);
});

test('moves viewed products to the front and enforces the history limit', () => {
  assert.deepEqual(
    updateRecentProductIds(['1', '2', '3'], '2', 3),
    ['2', '1', '3'],
  );
  assert.deepEqual(
    updateRecentProductIds(['1', '2', '3'], '4', 3),
    ['4', '1', '2'],
  );
});
