import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVariantMatrix,
  createBulkGeneratorDraft,
  createProductCsvTemplate,
  exportProductCsv,
  matrixRowToBulkPayload,
  parseCsv,
  previewProductCsv,
  stringifyCsv,
  validateMatrixRows,
} from '../src/services/catalog/adminBulkModel.js';

const lookups = {
  lines: [{ id: 'line-1', name: 'Pastel', slug: 'pastel', brand_id: 'brand-1' }],
  colors: [
    { id: 'color-1', exact_name: 'Rosa pastel', slug: 'rosa-pastel' },
    { id: 'color-2', exact_name: 'Azul pastel', slug: 'azul-pastel' },
  ],
  sizes: [
    { id: 'size-1', name: '5 pulgadas', slug: '5-pulgadas' },
    { id: 'size-2', name: '12 pulgadas', slug: '12-pulgadas' },
  ],
  locations: [{ id: 'location-1', name: 'Centro', slug: 'centro' }],
};

const product = {
  id: 'product-1',
  name: 'Globo latex Glomex',
  slug: 'globo-latex-glomex',
  brand_id: 'brand-1',
  brand: { name: 'Glomex' },
  category: { name: 'Globos latex' },
  variants: [{
    id: 'variant-existing',
    line_id: 'line-1',
    color_id: 'color-1',
    size_id: 'size-1',
    finish: null,
    sku: 'EXISTENTE',
    inventory_policy: 'shared_base_units',
    line: lookups.lines[0],
    color: lookups.colors[0],
    size: lookups.sizes[0],
    presentations: [],
    inventory: [],
  }],
};

test('genera la matriz cartesiana y bloquea combinaciones existentes', () => {
  const draft = {
    ...createBulkGeneratorDraft(product),
    line_id: 'line-1',
    color_ids: ['color-1', 'color-2'],
    size_ids: ['size-1', 'size-2'],
  };
  const rows = buildVariantMatrix(product, draft, lookups);

  assert.equal(rows.length, 4);
  assert.equal(rows.filter((row) => row.enabled).length, 3);
  assert.equal(rows[0].existing.id, 'variant-existing');
  assert.match(rows[1].sku, /ROSA-PASTEL-12-PULGADAS/);
});

test('convierte una fila en presentacion, mayoreo, caja e inventario', () => {
  const draft = {
    ...createBulkGeneratorDraft(product),
    presentation_name: 'Bolsa',
    contained_quantity: 100,
    base_price: 95,
    wholesale_minimum: 12,
    wholesale_price: 88,
    include_box: true,
    box_name: 'Caja',
    box_quantity: 12,
    box_price: 900,
    location_id: 'location-1',
    inventory_quantity: 1200,
  };
  const row = {
    key: 'row-1',
    enabled: true,
    existing: null,
    line_id: 'line-1',
    color_id: 'color-1',
    size_id: 'size-2',
    finish: null,
    sku: 'GLOBO-01',
    barcode: '',
    image_url: '',
    contained_quantity: 100,
    base_price: 95,
    wholesale_minimum: 12,
    wholesale_price: 88,
    inventory_quantity: 1200,
    label: 'Pastel / Rosa / 12',
  };
  const payload = matrixRowToBulkPayload(row, draft);

  assert.equal(payload.presentation.base_units_total, 100);
  assert.equal(payload.tier.minimum_quantity, 12);
  assert.equal(payload.box.contains_quantity, 12);
  assert.equal(payload.box.base_units_total, 1200);
  assert.equal(payload.inventory.quantity, 1200);
  assert.deepEqual(validateMatrixRows([row], draft), []);
});

test('detecta SKU repetido dentro de la matriz antes de guardar', () => {
  const draft = {
    ...createBulkGeneratorDraft(product),
    base_price: 10,
  };
  const baseRow = {
    key: 'row-1',
    enabled: true,
    existing: null,
    line_id: 'line-1',
    color_id: 'color-1',
    size_id: 'size-1',
    finish: null,
    sku: 'SKU-REPETIDO',
    contained_quantity: 100,
    base_price: 10,
    inventory_quantity: 0,
    label: 'Fila',
  };
  const errors = validateMatrixRows([
    baseRow,
    { ...baseRow, key: 'row-2', color_id: 'color-2' },
  ], draft);

  assert.match(errors.join(' '), /SKU-REPETIDO/);
});

test('CSV conserva comas, comillas y saltos de linea', () => {
  const source = [
    ['nombre', 'detalle'],
    ['Globo, rosa', 'Linea "Pastel"\nSuave'],
  ];
  const csv = stringifyCsv(source);
  assert.deepEqual(parseCsv(csv), source);
});

test('plantilla CSV se valida contra catalogos existentes', () => {
  const template = createProductCsvTemplate(product);
  const preview = previewProductCsv(template, { product, lookups });

  assert.equal(preview.errors.length, 0);
  assert.equal(preview.validCount, 1);
  assert.equal(preview.rows[0].payload.variant.line_id, 'line-1');
  assert.equal(preview.rows[0].payload.variant.color_id, 'color-1');
  assert.equal(preview.rows[0].payload.variant.size_id, 'size-2');
});

test('importacion rechaza otro producto y valores maestros desconocidos', () => {
  const template = createProductCsvTemplate(product)
    .replace('globo-latex-glomex', 'otro-producto')
    .replace('rosa-pastel', 'verde-inexistente');
  const preview = previewProductCsv(template, { product, lookups });

  assert.equal(preview.validCount, 0);
  assert.match(preview.rows[0].errors.join(' '), /slug/);
  assert.match(preview.rows[0].errors.join(' '), /Color desconocido/);
});

test('importacion rechaza tipos de presentacion desconocidos', () => {
  const template = createProductCsvTemplate(product).replace(',bolsa,', ',cubeta,');
  const preview = previewProductCsv(template, { product, lookups });

  assert.equal(preview.validCount, 0);
  assert.match(preview.rows[0].errors.join(' '), /Tipo de presentacion/);
});

test('exporta presentaciones, mayoreo e inventario sin perder identidad', () => {
  const exportable = {
    ...product,
    variants: [{
      ...product.variants[0],
      presentations: [{
        id: 'presentation-1',
        name: 'Bolsa',
        presentation_type: 'bolsa',
        contained_quantity: 100,
        contained_unit: 'pieza',
        contains_presentation_id: null,
        contains_quantity: null,
        base_units_total: 100,
        base_price: 95,
        active: true,
        tiers: [{
          minimum_quantity: 12,
          maximum_quantity: null,
          price_per_presentation: 88,
        }],
      }],
      inventory: [{
        sale_presentation_id: null,
        quantity: 1200,
        reserved_quantity: 100,
        location: lookups.locations[0],
      }],
    }],
  };
  const csv = exportProductCsv(exportable);
  const preview = previewProductCsv(csv, { product: exportable, lookups });

  assert.equal(preview.validCount, 1);
  assert.equal(preview.rows[0].payload.tier.price_per_presentation, 88);
  assert.equal(preview.rows[0].payload.inventory.quantity, 1200);
});
