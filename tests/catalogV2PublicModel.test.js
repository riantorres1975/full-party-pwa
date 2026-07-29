import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCardProductParams,
  buildCardTitle,
  buildCategoryHref,
  closeProductParams,
  getCardSearchMatch,
  getCatalogCategoryPath,
  getCardAction,
  getPrimaryPresentationType,
  getPresentationDescription,
  resolveInitialLineId,
  resolveInitialVariantSelection,
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
  }, {
    colorSlug: 'rojo-pastel',
    sizeName: '12 pulgadas',
  });
  assert.equal(opened.get('producto'), 'globo-latex-glomex');
  assert.equal(opened.get('gama'), 'pastel');
  assert.equal(opened.get('seleccionColor'), 'rojo-pastel');
  assert.equal(opened.get('seleccionMedida'), '12 pulgadas');
  assert.equal(opened.get('marca'), 'glomex');
  assert.equal(opened.get('q'), 'globo');

  const closed = closeProductParams(opened);
  assert.equal(closed.has('producto'), false);
  assert.equal(closed.has('seleccionColor'), false);
  assert.equal(closed.has('seleccionMedida'), false);
  assert.equal(closed.get('gama'), 'pastel');
});

test('destaca color y medida encontrados dentro de una familia', () => {
  assert.deepEqual(getCardSearchMatch({
    colors: [
      {
        slug: 'rojo-coral',
        name: 'Rojo coral',
        hex: '#E76F51',
        imageUrl: '/rojo-coral.webp',
      },
      { slug: 'rojo-oscuro', name: 'Rojo oscuro', hex: '#7A2633' },
    ],
    sizes: [
      { id: '10', name: '10 pulgadas' },
      { id: '12', name: '12 pulgadas' },
    ],
  }, 'rojo 12'), {
    colorSlug: 'rojo-coral',
    colorName: 'Rojo coral',
    colorHex: '#E76F51',
    colorImageUrl: '/rojo-coral.webp',
    colorCount: 2,
    sizeId: '12',
    sizeName: '12 pulgadas',
    label: 'Rojo coral +1 · 12 pulgadas',
  });
  assert.equal(getCardSearchMatch({ colors: [], sizes: [] }, 'glomex'), null);
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

test('preselecciona la combinacion encontrada por la busqueda', () => {
  const variants = [
    {
      line_id: 'retro-id',
      line_slug: 'retro',
      color_id: 'coral-id',
      color_slug: 'rojo-coral',
      size_id: 'size-12',
      size_name: '12 pulgadas',
    },
  ];
  assert.deepEqual(resolveInitialVariantSelection(variants, {
    lineSlug: 'retro',
    colorSlug: 'rojo-coral',
    sizeName: '12 pulgadas',
  }), {
    lineId: 'retro-id',
    colorId: 'coral-id',
    sizeId: 'size-12',
  });
});
