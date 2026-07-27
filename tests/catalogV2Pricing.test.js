import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptPresentation } from '../src/services/catalog/adapters.js';
import {
  buildCartLineKey,
  resolveNextTier,
  resolvePresentationPricing,
  resolveUnitPrice,
} from '../src/services/catalog/pricing.js';

const bag = adaptPresentation({
  id: 'bag-100',
  base_price: 85,
  base_units_total: 100,
  tiers: [{
    minimum_quantity: 12,
    maximum_quantity: null,
    price_per_presentation: 78,
    label: 'Mayoreo',
  }],
});

test('aplica precio base a 11 bolsas y mayoreo desde 12', () => {
  assert.equal(resolveUnitPrice(bag, 11).unitPrice, 85);
  assert.equal(resolveUnitPrice(bag, 12).unitPrice, 78);
  assert.equal(resolveUnitPrice(bag, 20).unitPrice, 78);
});

test('informa el siguiente nivel y calcula subtotal y contenido total', () => {
  assert.deepEqual(resolveNextTier(bag, 5), {
    minimumQuantity: 12,
    missing: 7,
    price: 78,
    label: 'Mayoreo',
  });

  const pricing = resolvePresentationPricing(bag, 12);
  assert.equal(pricing.subtotal, 936);
  assert.equal(pricing.totalUnits, 1200);
  assert.equal(pricing.tierLabel, 'Mayoreo');
});

test('acepta tambien la forma cruda de Supabase y separa presentaciones', () => {
  assert.equal(resolveUnitPrice({
    base_price: 900,
    tiers: [],
  }, 1).unitPrice, 900);
  assert.notEqual(
    buildCartLineKey('variant-1', 'bag-100'),
    buildCartLineKey('variant-1', 'box-12'),
  );
});
