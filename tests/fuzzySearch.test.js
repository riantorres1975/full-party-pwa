import assert from 'node:assert/strict';
import test from 'node:test';
import { createFuzzySearchIndex, fuzzySearch } from '../src/utils/fuzzySearch.js';

const products = [
  { id: 1, nombre: 'Globo corazón rosa', categoria: 'Globos' },
  { id: 2, nombre: 'Bomba manual', categoria: 'Accesorios' },
  { id: 3, nombre: 'Confeti dorado', categoria: 'Decoración' },
];
const keys = [
  { name: 'nombre', weight: 0.8 },
  { name: 'categoria', weight: 0.2 },
];

test('a reusable index searches several queries without changing its collection', () => {
  const index = createFuzzySearchIndex(products, keys);

  assert.deepEqual(index.search('globo').map(({ id }) => id), [1]);
  assert.deepEqual(index.search('bomba').map(({ id }) => id), [2]);
  assert.equal(index.search('corazon')[0].id, 1);
  assert.equal(index.search(''), products);
});

test('the one-shot helper keeps its existing behavior', () => {
  assert.deepEqual(fuzzySearch(products, 'confeti', keys).map(({ id }) => id), [3]);
  assert.deepEqual(fuzzySearch([], 'globo', keys), []);
  assert.equal(fuzzySearch(products, '  ', keys), products);
});
