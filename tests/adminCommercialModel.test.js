import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPresentationDraft,
  normalizeInventoryPayload,
  normalizePresentationPayload,
  priceTierRangesOverlap,
  validateInventoryPayload,
  validatePresentationPayload,
  validatePriceTierPayload,
  validateVariantPayload,
} from '../src/services/catalog/adminCommercialModel.js';

test('una variante simple exige una identidad comercial', () => {
  const invalid = validateVariantPayload({}, 'product-1');
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.sku, /SKU/);

  const valid = validateVariantPayload({ sku: 'BOMBA-01' }, 'product-1');
  assert.equal(valid.valid, true);
  assert.equal(valid.payload.inventory_policy, 'shared_base_units');
});

test('normaliza una presentacion con contenido directo', () => {
  const payload = normalizePresentationPayload({
    name: ' Bolsa de 100 piezas ',
    presentation_type: 'bolsa',
    content_mode: 'direct',
    base_unit: 'pieza',
    contained_quantity: '100',
    contained_unit: 'pieza',
    base_units_total: '100',
    base_price: '85',
    minimum_order_quantity: '1',
    quantity_step: '1',
  }, 'variant-1');

  assert.equal(payload.name, 'Bolsa de 100 piezas');
  assert.equal(payload.contained_quantity, 100);
  assert.equal(payload.contains_presentation_id, null);
  assert.equal(payload.base_price, 85);
});

test('valida una caja compuesta por otra presentacion', () => {
  const draft = createPresentationDraft();
  const result = validatePresentationPayload({
    ...draft,
    name: 'Caja de 12 bolsas',
    presentation_type: 'caja',
    content_mode: 'composed',
    contains_presentation_id: 'bag-1',
    contains_quantity: 12,
    base_units_total: 1200,
    base_price: 900,
  }, 'variant-1');

  assert.equal(result.valid, true);
  assert.equal(result.payload.contained_quantity, null);
  assert.equal(result.payload.contains_presentation_id, 'bag-1');
  assert.equal(result.payload.contains_quantity, 12);
});

test('rechaza presentaciones con contenido o limites invalidos', () => {
  const result = validatePresentationPayload({
    name: 'Caja',
    presentation_type: 'caja',
    content_mode: 'composed',
    contains_presentation_id: '',
    contains_quantity: 0,
    base_units_total: 0,
    base_price: -1,
    minimum_order_quantity: 3,
    quantity_step: 0,
    maximum_order_quantity: 2,
  }, 'variant-1');

  assert.equal(result.valid, false);
  assert.match(result.errors.contains_presentation_id, /presentacion/);
  assert.match(result.errors.base_units_total, /mayor a cero/);
  assert.match(result.errors.base_price, /negativo/);
  assert.match(result.errors.quantity_step, /entero/);
  assert.match(result.errors.maximum_order_quantity, /maximo/);
});

test('detecta rangos de mayoreo superpuestos e inclusivos', () => {
  assert.equal(priceTierRangesOverlap(
    { minimum_quantity: 12, maximum_quantity: 49 },
    { minimum_quantity: 49, maximum_quantity: 99 },
  ), true);
  assert.equal(priceTierRangesOverlap(
    { minimum_quantity: 12, maximum_quantity: 49 },
    { minimum_quantity: 50, maximum_quantity: 99 },
  ), false);

  const result = validatePriceTierPayload(
    {
      minimum_quantity: 20,
      maximum_quantity: 60,
      price_per_presentation: 82,
      active: true,
    },
    'presentation-1',
    [{ id: 'tier-1', minimum_quantity: 12, maximum_quantity: 49, active: true }],
  );
  assert.equal(result.valid, false);
  assert.match(result.errors.minimum_quantity, /superpone/);
});

test('inventario separado exige presentacion y protege reservas', () => {
  const result = validateInventoryPayload({
    variant_id: 'variant-1',
    location_id: 'location-1',
    sale_presentation_id: '',
    quantity: 10,
    reserved_quantity: 11,
  }, { inventory_policy: 'separate_by_presentation' });

  assert.equal(result.valid, false);
  assert.match(result.errors.sale_presentation_id, /presentacion/);
  assert.match(result.errors.reserved_quantity, /superar/);
});

test('inventario compartido elimina la presentacion del payload', () => {
  const result = validateInventoryPayload({
    variant_id: 'variant-1',
    location_id: 'location-1',
    sale_presentation_id: 'presentation-1',
    quantity: 100,
    reserved_quantity: 10,
  }, { inventory_policy: 'shared_base_units' });

  assert.equal(result.valid, true);
  assert.equal(result.payload.sale_presentation_id, null);
  assert.deepEqual(normalizeInventoryPayload(result.payload), result.payload);
});

test('una presentacion puede separar inventario dentro de una variante compartida', () => {
  const result = validateInventoryPayload({
    variant_id: 'variant-1',
    location_id: 'location-1',
    sale_presentation_id: 'box-1',
    quantity: 8,
    reserved_quantity: 1,
  }, {
    inventory_policy: 'shared_base_units',
    presentations: [
      { id: 'box-1', inventory_policy: 'separate_by_presentation' },
    ],
  });

  assert.equal(result.valid, true);
  assert.equal(result.payload.sale_presentation_id, 'box-1');
});
