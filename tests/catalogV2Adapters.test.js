import test from 'node:test';
import assert from 'node:assert/strict';

import {
  adaptCard,
  adaptCartItemsForRpc,
  adaptCardsResponse,
  adaptPresentation,
  adaptProductDetail,
  buildCategoryTree,
  cardRequiresOptions,
  indexCategoriesBySlug,
} from '../src/services/catalog/adapters.js';

test('permite agregar directo solo con una variante y una presentacion reales', () => {
  const directCard = adaptCard({
    group_key: 'simple',
    variant_count: 1,
    presentation_count: 1,
    color_count: 0,
    line_count: 0,
    sizes: [],
    presentation_types: ['pieza'],
  });

  assert.equal(directCard.requiresOptions, false);
  assert.equal(cardRequiresOptions(directCard), false);
  assert.equal(adaptCard({
    variant_count: 1,
    presentation_count: 2,
    presentation_types: ['bolsa'],
  }).requiresOptions, true);
});

test('normaliza numeros sin convertir valores opcionales null a cero', () => {
  const presentation = adaptPresentation({
    id: 'presentation-1',
    base_price: '85.00',
    compare_at_price: null,
    contained_quantity: null,
    base_units_total: '100',
    maximum_order_quantity: null,
  });

  assert.equal(presentation.basePrice, 85);
  assert.equal(presentation.baseUnitsTotal, 100);
  assert.equal(presentation.compareAtPrice, null);
  assert.equal(presentation.containedQuantity, null);
  assert.equal(presentation.maximumOrderQuantity, null);
  assert.equal(presentation.availableQuantity, null);
  assert.equal(presentation.inStock, null);
});

test('devuelve respuestas defensivas para tarjetas y detalle', () => {
  assert.deepEqual(adaptCardsResponse(null), {
    cards: [],
    total: 0,
    limit: 24,
    offset: 0,
  });
  assert.equal(adaptProductDetail(null), null);

  const detail = adaptProductDetail({
    product: { id: 'product-1', name: 'Bomba manual' },
    variants: [{ id: 'variant-1', presentations: null }],
  });
  assert.equal(detail.product.name, 'Bomba manual');
  assert.deepEqual(detail.variants[0].presentations, []);
  assert.deepEqual(detail.images, []);
});

test('conserva lineas invalidas para que Supabase las reporte', () => {
  assert.deepEqual(adaptCartItemsForRpc([
    { variantId: 'variant-1', salePresentationId: 'presentation-1', quantity: 2 },
    { variant_id: null, sale_presentation_id: 'presentation-2', quantity: 0 },
  ]), [
    {
      variant_id: 'variant-1',
      sale_presentation_id: 'presentation-1',
      quantity: 2,
    },
    {
      variant_id: null,
      sale_presentation_id: 'presentation-2',
      quantity: 0,
    },
  ]);
});

test('construye, ordena e indexa el arbol de categorias', () => {
  const tree = buildCategoryTree([
    { id: 'child', parent_id: 'root', name: 'Latex', slug: 'latex', sort_order: 2 },
    { id: 'root', parent_id: null, name: 'Globos', slug: 'globos', sort_order: 1 },
    { id: 'first', parent_id: 'root', name: 'Burbuja', slug: 'burbuja', sort_order: 1 },
  ]);

  assert.deepEqual(tree.map((node) => node.slug), ['globos']);
  assert.deepEqual(tree[0].children.map((node) => node.slug), ['burbuja', 'latex']);
  assert.deepEqual(indexCategoriesBySlug(tree).get('latex').path, ['globos', 'latex']);
});
