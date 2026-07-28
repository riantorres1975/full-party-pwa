import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addCatalogCartItem,
  buildCatalogCartItem,
  CATALOG_CART_SCHEMA,
  getCatalogCartFingerprint,
  getCatalogCartTotal,
  parseCatalogCart,
  serializeCatalogCart,
  updateCatalogCartQuantity,
} from '../src/services/catalog/cart.js';

const product = {
  id: 'product-glomex',
  name: 'Globo Látex Glomex',
  brand: { name: 'Glomex' },
  mainImageUrl: '/glomex.webp',
};

const variant = {
  id: 'variant-standard-red-12',
  line_name: 'Estándar',
  color_name: 'Rojo',
  size_name: '12 pulgadas',
  sku: 'GLOMEX-ESTANDAR-ROJO-12',
  image_url: '/red.webp',
};

const bag = {
  id: 'presentation-bag-100',
  name: 'Bolsa de 100 piezas',
  presentationType: 'bolsa',
  baseUnit: 'pieza',
  baseUnitsTotal: 100,
  basePrice: 85,
  minimumOrderQuantity: 1,
  quantityStep: 1,
  maximumOrderQuantity: null,
  availableQuantity: 240,
  tiers: [{
    minimumQuantity: 12,
    maximumQuantity: null,
    pricePerPresentation: 78,
    label: 'Mayoreo',
  }],
};

const box = {
  ...bag,
  id: 'presentation-box-100',
  name: 'Caja de 100 bolsas',
  presentationType: 'caja',
  baseUnitsTotal: 10000,
  basePrice: 900,
  availableQuantity: 2,
  tiers: [],
};

test('construye snapshot V2 con identidad, precio y contenido', () => {
  const item = buildCatalogCartItem({
    product,
    variant,
    presentation: bag,
    quantity: 12,
  });

  assert.equal(item.schema, CATALOG_CART_SCHEMA);
  assert.equal(item.key, `${variant.id}::${bag.id}`);
  assert.equal(item.unitPrice, 78);
  assert.equal(item.subtotal, 936);
  assert.equal(item.totalUnits, 1200);
  assert.equal(item.tierLabel, 'Mayoreo');
  assert.equal(item.presentationName, 'Bolsa de 100 piezas');
});

test('misma variante y presentacion se acumulan y recalculan mayoreo', () => {
  const eleven = buildCatalogCartItem({
    product,
    variant,
    presentation: bag,
    quantity: 11,
  });
  const one = buildCatalogCartItem({
    product,
    variant,
    presentation: bag,
    quantity: 1,
  });

  const items = addCatalogCartItem([eleven], one);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 12);
  assert.equal(items[0].unitPrice, 78);
  assert.equal(items[0].subtotal, 936);
});

test('presentaciones y variantes diferentes permanecen separadas', () => {
  const bagItem = buildCatalogCartItem({
    product,
    variant,
    presentation: bag,
    quantity: 1,
  });
  const boxItem = buildCatalogCartItem({
    product,
    variant,
    presentation: box,
    quantity: 1,
  });
  const blueItem = buildCatalogCartItem({
    product,
    variant: { ...variant, id: 'variant-standard-blue-12', color_name: 'Azul' },
    presentation: { ...bag, id: 'presentation-blue-bag' },
    quantity: 1,
  });

  const items = addCatalogCartItem(
    addCatalogCartItem([bagItem], boxItem),
    blueItem,
  );
  assert.equal(items.length, 3);
  assert.equal(getCatalogCartTotal(items), 1070);
});

test('respeta disponibilidad local y elimina al reducir a cero', () => {
  const item = buildCatalogCartItem({
    product,
    variant,
    presentation: box,
    quantity: 2,
  });
  const extra = buildCatalogCartItem({
    product,
    variant,
    presentation: box,
    quantity: 1,
  });

  assert.deepEqual(addCatalogCartItem([item], extra), [item]);
  assert.deepEqual(updateCatalogCartQuantity([item], item.key, 0), []);
});

test('persistencia solo restaura el esquema V2 y descarta carritos legacy', () => {
  const item = buildCatalogCartItem({
    product,
    variant,
    presentation: bag,
    quantity: 12,
  });
  assert.deepEqual(parseCatalogCart(serializeCatalogCart([item])), [item]);
  assert.deepEqual(parseCatalogCart(JSON.stringify([{ id: 'legacy-product' }])), []);
  assert.deepEqual(parseCatalogCart('not-json'), []);
});

test('fingerprint cambia con cliente, entrega o contenido', () => {
  const item = buildCatalogCartItem({
    product,
    variant,
    presentation: bag,
    quantity: 1,
  });
  const pickup = getCatalogCartFingerprint([item], {
    nombre: 'Ana',
    telefono: '4521234567',
    tipoEntrega: 'tienda',
  });
  const delivery = getCatalogCartFingerprint([item], {
    nombre: 'Ana',
    telefono: '4521234567',
    tipoEntrega: 'envio',
    direccion: 'Centro, Uruapan',
  });

  assert.notEqual(pickup, delivery);
  assert.notEqual(
    pickup,
    getCatalogCartFingerprint([{ ...item, quantity: 2 }], {
      nombre: 'Ana',
      telefono: '4521234567',
      tipoEntrega: 'tienda',
    }),
  );
});
