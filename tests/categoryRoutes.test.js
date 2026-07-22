import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCategoryRoute, slugifyCategory } from '../src/utils/categoryRoutes.js';

const products = [
  { id: 1, nombre: 'Glomex Azul', categoria: 'Globo Latex', descripcion: 'Globo de alta calidad' },
  { id: 2, nombre: 'Numero Azul 0', categoria: 'Globo Número-16', descripcion: 'Globo Foil' },
  { id: 3, nombre: 'Bomba Manual', categoria: 'Infladora De Globos', descripcion: 'Inflador manual' },
  { id: 4, nombre: 'Confeti Dorado', categoria: 'Confeti', descripcion: '' },
];

test('slugifies dynamic category names safely', () => {
  assert.equal(slugifyCategory('  Globo Número-16  '), 'globo-numero-16');
});

test('resolves curated category routes against product content', () => {
  const route = resolveCategoryRoute('globos-latex', products);

  assert.equal(route.label, 'Globos de Látex');
  assert.deepEqual(route.categoryIds, ['Globo Latex']);
  assert.equal(route.matches(products[0]), true);
  assert.equal(route.matches(products[1]), false);
});

test('canonicalizes supported aliases', () => {
  const route = resolveCategoryRoute('globos-numeros', products);

  assert.equal(route.canonicalSlug, 'globos-numero');
  assert.deepEqual(route.categoryIds, ['Globo Número-16']);
});

test('supports categories created dynamically in Supabase', () => {
  const route = resolveCategoryRoute('confeti', products);

  assert.equal(route.label, 'Confeti');
  assert.deepEqual(products.filter(route.matches).map(({ id }) => id), [4]);
});

test('returns null for an unknown dynamic route', () => {
  assert.equal(resolveCategoryRoute('categoria-inexistente', products), null);
});
