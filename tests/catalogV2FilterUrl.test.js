import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearAllFilters,
  countActiveFilters,
  parseFiltersFromSearchParams,
  resolveSizeIds,
  serializeFiltersToSearchParams,
  sizeNameToSlug,
} from '../src/services/catalog/filterUrl.js';

test('serializa y restaura filtros multiples del catalogo', () => {
  const filters = parseFiltersFromSearchParams(new URLSearchParams(
    'marca=glomex,sempertex&gama=pastel&familiaColor=azul&medida=12-pulgadas'
      + '&min=50&max=100&stock=1&orden=price_asc&q=globo',
  ));

  assert.deepEqual(filters.brands, ['glomex', 'sempertex']);
  assert.deepEqual(filters.lines, ['pastel']);
  assert.equal(filters.inStock, true);
  assert.equal(filters.minPrice, 50);
  assert.equal(filters.sort, 'price_asc');

  const roundTrip = parseFiltersFromSearchParams(serializeFiltersToSearchParams(filters));
  assert.deepEqual(roundTrip, filters);
});

test('descarta precios, stock y orden invalidos', () => {
  const filters = parseFiltersFromSearchParams(
    new URLSearchParams('min=-1&max=abc&stock=quizas&orden=aleatorio'),
  );

  assert.equal(filters.minPrice, null);
  assert.equal(filters.maxPrice, null);
  assert.equal(filters.inStock, null);
  assert.equal(filters.sort, 'featured');
});

test('genera slugs de medidas y los resuelve a UUID', () => {
  assert.equal(sizeNameToSlug(' 12 Pulgadas '), '12-pulgadas');
  assert.equal(sizeNameToSlug('Centimetros'), 'centimetros');
  assert.deepEqual(resolveSizeIds(
    ['12-pulgadas'],
    [{ id: 'size-12', name: '12 pulgadas' }, { id: 'size-18', name: '18 pulgadas' }],
  ), ['size-12']);
});

test('cuenta filtros activos y limpiar todos conserva busqueda y orden', () => {
  const filters = parseFiltersFromSearchParams(
    new URLSearchParams('marca=glomex&color=rojo,azul&min=20&q=globos&orden=name_asc'),
  );
  assert.equal(countActiveFilters(filters), 4);

  const cleared = clearAllFilters(filters);
  assert.equal(cleared.search, 'globos');
  assert.equal(cleared.sort, 'name_asc');
  assert.deepEqual(cleared.brands, []);
  assert.deepEqual(cleared.colors, []);
  assert.equal(cleared.minPrice, null);
});
