import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptAdminProduct,
  createAdminProductDraft,
  getAdminProductReadiness,
  normalizeAdminProductPayload,
  validateAdminProductPayload,
} from '../src/services/catalog/adminProductModel.js';

test('createAdminProductDraft inicia como borrador seguro', () => {
  const draft = createAdminProductDraft();
  assert.equal(draft.active, false);
  assert.equal(draft.featured, false);
  assert.equal(draft.listing_group_mode, 'product');
});

test('normalizeAdminProductPayload genera slug y limpia opcionales', () => {
  const payload = normalizeAdminProductPayload({
    name: ' Globo Látex Glomex ',
    slug: '',
    category_id: 'cat-1',
    brand_id: '',
    short_description: ' ',
    listing_group_mode: 'line',
    active: true,
  });
  assert.equal(payload.name, 'Globo Látex Glomex');
  assert.equal(payload.slug, 'globo-latex-glomex');
  assert.equal(payload.brand_id, null);
  assert.equal(payload.short_description, null);
  assert.equal(payload.listing_group_mode, 'line');
});

test('validateAdminProductPayload exige identidad y categoria', () => {
  const result = validateAdminProductPayload({ name: '', slug: '', category_id: '' });
  assert.equal(result.valid, false);
  assert.match(result.errors.name, /obligatorio/);
  assert.match(result.errors.category_id, /categoria/);
});

test('adaptAdminProduct resume variantes, precios e inventario', () => {
  const product = adaptAdminProduct({
    id: 'p-1',
    name: 'Globos',
    slug: 'globos',
    category_id: 'cat-1',
    active: true,
    variants: [
      {
        id: 'v-1',
        active: true,
        presentations: [
          {
            id: 'sp-1',
            base_price: '95.00',
            base_units_total: '100',
            tiers: [{ id: 't-1', minimum_quantity: 12, price_per_presentation: '88' }],
          },
        ],
        inventory: [{ id: 'i-1', quantity: '2400', reserved_quantity: '100' }],
      },
    ],
  });

  assert.equal(product.variantCount, 1);
  assert.equal(product.presentationCount, 1);
  assert.equal(product.priceTierCount, 1);
  assert.equal(product.minPrice, 95);
  assert.equal(product.inventoryAvailable, 2300);
});

test('getAdminProductReadiness bloquea familias incompletas', () => {
  const incomplete = getAdminProductReadiness({
    name: 'Globos',
    slug: 'globos',
    category_id: 'cat-1',
    variantCount: 0,
    presentationCount: 0,
  });
  assert.equal(incomplete.publishable, false);
  assert.equal(incomplete.percent, 25);

  const complete = getAdminProductReadiness({
    name: 'Globos',
    slug: 'globos',
    category_id: 'cat-1',
    main_image_url: 'https://example.com/globo.webp',
    variantCount: 1,
    presentationCount: 1,
  });
  assert.equal(complete.publishable, true);
  assert.equal(complete.percent, 100);
});
