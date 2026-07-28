import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applySelection,
  createInitialSelection,
  getCandidateVariants,
  getDimensionStates,
  getQuantityError,
  normalizeQuantity,
} from '../src/services/catalog/variantSelection.js';

const variants = [
  {
    id: 'v-pastel-rosa-12',
    line_id: 'pastel',
    line_name: 'Pastel',
    color_id: 'rosa',
    color_name: 'Rosa pastel',
    size_id: '12',
    size_name: '12 pulgadas',
    presentations: [{ id: 'bag-rosa', minimumOrderQuantity: 1, quantityStep: 1 }],
  },
  {
    id: 'v-pastel-azul-12',
    line_id: 'pastel',
    line_name: 'Pastel',
    color_id: 'azul',
    color_name: 'Azul pastel',
    size_id: '12',
    size_name: '12 pulgadas',
    presentations: [{ id: 'bag-azul', minimumOrderQuantity: 1, quantityStep: 1 }],
  },
  {
    id: 'v-chrome-dorado-18',
    line_id: 'chrome',
    line_name: 'Chrome',
    color_id: 'dorado',
    color_name: 'Dorado chrome',
    size_id: '18',
    size_name: '18 pulgadas',
    presentations: [{ id: 'bag-dorado', minimumOrderQuantity: 1, quantityStep: 1 }],
  },
];

test('filtra variantes candidatas con las claves camelCase de la seleccion', () => {
  assert.deepEqual(
    getCandidateVariants(variants, { lineId: 'pastel' }).map((variant) => variant.id),
    ['v-pastel-rosa-12', 'v-pastel-azul-12'],
  );
  assert.deepEqual(
    getCandidateVariants(variants, { lineId: 'chrome', colorId: 'dorado' })
      .map((variant) => variant.id),
    ['v-chrome-dorado-18'],
  );
});

test('limita opciones en cascada y no ofrece combinaciones inexistentes', () => {
  const states = getDimensionStates(variants, {
    lineId: 'chrome',
    colorId: 'dorado',
    sizeId: null,
  });

  assert.deepEqual(states.colorId.options.map((option) => option.id), ['dorado']);
  assert.deepEqual(states.sizeId.options.map((option) => option.id), ['18']);
  assert.equal(states.sizeId.options.some((option) => option.id === '5'), false);
});

test('preserva deep links completos y resuelve variante y presentacion', () => {
  const result = createInitialSelection(variants, {
    lineId: 'pastel',
    colorId: 'rosa',
    sizeId: '12',
    presentationId: 'bag-rosa',
  });

  assert.equal(result.variant.id, 'v-pastel-rosa-12');
  assert.equal(result.presentation.id, 'bag-rosa');
  assert.equal(result.selection.colorId, 'rosa');
  assert.equal(result.complete, true);
});

test('al cambiar gama limpia dependencias y autoselecciona la unica combinacion', () => {
  const result = applySelection(
    variants,
    {
      lineId: 'pastel',
      colorId: 'rosa',
      sizeId: '12',
      presentationId: 'bag-rosa',
      quantity: 1,
    },
    { lineId: 'chrome' },
  );

  assert.equal(result.selection.colorId, 'dorado');
  assert.equal(result.selection.sizeId, '18');
  assert.equal(result.selection.presentationId, 'bag-dorado');
  assert.equal(result.variant.id, 'v-chrome-dorado-18');
  assert.equal(result.complete, true);
});

test('producto simple oculta dimensiones y queda listo para agregar', () => {
  const result = createInitialSelection([{
    id: 'simple',
    line_id: null,
    color_id: null,
    size_id: null,
    presentations: [{ id: 'piece' }],
  }]);

  assert.equal(result.variant.id, 'simple');
  assert.equal(result.selection.presentationId, 'piece');
  assert.equal(result.complete, true);
});

test('expone y resuelve variantes diferenciadas por acabado o atributo', () => {
  const finishVariants = [
    {
      id: 'letter-a',
      line_id: null,
      color_id: null,
      size_id: null,
      finish: 'A',
      image_url: '/a.webp',
      presentations: [{ id: 'piece-a' }],
    },
    {
      id: 'letter-b',
      line_id: null,
      color_id: null,
      size_id: null,
      finish: 'B',
      image_url: '/b.webp',
      presentations: [{ id: 'piece-b' }],
    },
  ];

  const initial = createInitialSelection(finishVariants);
  assert.equal(initial.complete, false);

  const states = getDimensionStates(finishVariants, initial.selection);
  assert.equal(states.finish.visible, true);
  assert.deepEqual(states.finish.options.map((option) => option.name), ['A', 'B']);

  const selected = applySelection(finishVariants, initial.selection, { finish: 'B' });
  assert.equal(selected.variant.id, 'letter-b');
  assert.equal(selected.presentation.id, 'piece-b');
  assert.equal(selected.complete, true);
});

test('normaliza minimo, paso y maximo con presentaciones adaptadas o crudas', () => {
  const adapted = {
    minimumOrderQuantity: 2,
    quantityStep: 3,
    maximumOrderQuantity: 10,
  };
  assert.equal(normalizeQuantity(adapted, 1), 2);
  assert.equal(normalizeQuantity(adapted, 8), 8);
  assert.equal(normalizeQuantity(adapted, 10), 8);
  assert.equal(getQuantityError(adapted, 9)?.code, 'quantity_step');
  assert.equal(getQuantityError(adapted, 11)?.code, 'max_quantity');

  const raw = {
    minimum_order_quantity: 1,
    quantity_step: 2,
    maximum_order_quantity: null,
  };
  assert.equal(normalizeQuantity(raw, 9), 9);
  assert.equal(getQuantityError(raw, 999), null);
});
