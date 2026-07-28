import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCardProductParams,
  buildCardTitle,
  buildCategoryHref,
  closeProductParams,
  getCatalogCategoryPath,
  getCardAction,
  getPrimaryPresentationType,
  getPresentationDescription,
  resolveInitialLineId,
} from '../src/services/catalog/publicCatalogModel.js';

test('extrae rutas jerarquicas desde la URL publica', () => {
  assert.equal(getCatalogCategoryPath('/catalogo'), '');
  assert.equal(getCatalogCategoryPath('/catalogo/globos'), 'globos');
  assert.equal(
    getCatalogCategoryPath('/catalogo/globos/globos-latex/'),
    'globos/globos-latex',
  );
  assert.equal(getCatalogCategoryPath('/admin/catalogo'), '');
});

test('construye rutas jerarquicas de categorias', () => {
  assert.equal(
    buildCategoryHref({ path: ['globos', 'globos-latex'] }),
    '/catalogo/globos/globos-latex',
  );
  assert.equal(buildCategoryHref(null), '/catalogo');
});

test('agrupa nombre y gama sin repetir el texto', () => {
  assert.equal(
    buildCardTitle({ name: 'Globo latex Glomex', lineName: 'Pastel' }),
    'Globo latex Glomex Pastel',
  );
  assert.equal(
    buildCardTitle({ name: 'Globo Glomex Pastel', lineName: 'Pastel' }),
    'Globo Glomex Pastel',
  );
});

test('decide CTA por disponibilidad y opciones reales', () => {
  assert.deepEqual(getCardAction({ inStock: false }), {
    label: 'No disponible',
    disabled: true,
    kind: 'unavailable',
  });
  assert.equal(getCardAction({
    inStock: true,
    variantCount: 4,
    presentationCount: 4,
    colorCount: 4,
    lineCount: 1,
    sizes: [{ id: 'size' }],
  }).kind, 'options');
  assert.equal(getCardAction({
    inStock: true,
    variantCount: 1,
    presentationCount: 1,
    colorCount: 0,
    lineCount: 0,
    sizes: [],
  }).kind, 'simple');
});

test('prioriza la presentacion principal sobre la caja', () => {
  assert.equal(getPrimaryPresentationType(['caja', 'lata']), 'lata');
  assert.equal(getPrimaryPresentationType(['caja', 'pieza']), 'pieza');
  assert.equal(getPrimaryPresentationType(['caja', 'bolsa']), 'bolsa');
  assert.equal(getPrimaryPresentationType(['caja']), 'caja');
  assert.equal(getPrimaryPresentationType([]), 'presentación');
});

test('abre y cierra detalle conservando filtros URL', () => {
  const opened = buildCardProductParams('marca=glomex&q=globo', {
    slug: 'globo-latex-glomex',
    lineSlug: 'pastel',
  });
  assert.equal(opened.get('producto'), 'globo-latex-glomex');
  assert.equal(opened.get('gama'), 'pastel');
  assert.equal(opened.get('marca'), 'glomex');
  assert.equal(opened.get('q'), 'globo');

  const closed = closeProductParams(opened);
  assert.equal(closed.has('producto'), false);
  assert.equal(closed.get('gama'), 'pastel');
});

test('resume contenido de presentaciones directas y compuestas', () => {
  assert.equal(getPresentationDescription({
    containedQuantity: 100,
    containedUnit: 'piezas',
  }), '100 piezas');
  assert.equal(getPresentationDescription({
    containsQuantity: 12,
    containsPresentationId: 'bolsa',
  }), '12 presentaciones');
});

test('resuelve gama inicial desde el slug de la tarjeta', () => {
  assert.equal(resolveInitialLineId([
    { line_id: 'standard-id', line_slug: 'estandar' },
    { line_id: 'pastel-id', line_slug: 'pastel' },
  ], 'pastel'), 'pastel-id');
  assert.equal(resolveInitialLineId([], 'pastel'), null);
});
