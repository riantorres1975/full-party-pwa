import test from 'node:test';
import assert from 'node:assert/strict';

import { isCollectionCurrent } from '../src/services/catalog/collectionWindow.js';

test('mantiene una coleccion activa durante todo su ultimo dia', () => {
  const collection = {
    start_date: '2026-07-01',
    end_date: '2026-07-27',
  };

  assert.equal(isCollectionCurrent(
    collection,
    new Date(2026, 6, 27, 23, 59, 59),
  ), true);
  assert.equal(isCollectionCurrent(
    collection,
    new Date(2026, 6, 28, 0, 0, 0),
  ), false);
});

test('respeta inicio inclusivo y ventanas abiertas', () => {
  assert.equal(isCollectionCurrent(
    { start_date: '2026-07-28', end_date: null },
    new Date(2026, 6, 27, 12),
  ), false);
  assert.equal(isCollectionCurrent(
    { start_date: '2026-07-28', end_date: null },
    new Date(2026, 6, 28, 0),
  ), true);
  assert.equal(isCollectionCurrent({}, new Date(2026, 6, 28)), true);
});
