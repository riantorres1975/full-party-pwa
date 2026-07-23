import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeCatalogQuality,
  buildCatalogCorrectionQueue,
  CATALOG_QUALITY_ISSUES,
  getPublishingBlockers,
  isPlaceholderProductImage,
  normalizeCatalogDuplicateValue,
} from '../src/utils/catalogQuality.js';

function completeProduct(overrides = {}) {
  return {
    id: 'p-1',
    nombre: 'Globo Azul',
    descripcion: 'Globo azul para decoracion',
    precio: 85,
    imagen_url: 'https://cdn.example.com/globo-azul.webp',
    categoria: 'Globo Latex',
    marca: 'Glomex',
    stock_ilimitado: false,
    stock_actual: 8,
    ...overrides,
  };
}

test('normalizes duplicate names without accents or punctuation', () => {
  assert.equal(
    normalizeCatalogDuplicateValue('  Glómex Azul, 12 Pulg. '),
    'glomex azul 12 pulg',
  );
});

test('detects missing publishing requirements and placeholder images', () => {
  const product = completeProduct({
    descripcion: '',
    precio: 0,
    imagen_url: 'https://placehold.co/1200x1200/f3e8ff/a855f7?text=Globo',
    categoria: null,
    stock_actual: -1,
  });

  assert.equal(isPlaceholderProductImage(product.imagen_url), true);
  assert.deepEqual(getPublishingBlockers(product), [
    CATALOG_QUALITY_ISSUES.MISSING_IMAGE,
    CATALOG_QUALITY_ISSUES.MISSING_DESCRIPTION,
    CATALOG_QUALITY_ISSUES.MISSING_CATEGORY,
    CATALOG_QUALITY_ISSUES.INVALID_PRICE,
    CATALOG_QUALITY_ISSUES.INVALID_STOCK,
  ]);
  assert.deepEqual(
    getPublishingBlockers(completeProduct({ stock_actual: null })),
    [CATALOG_QUALITY_ISSUES.INVALID_STOCK],
  );
});

test('summarizes incomplete and duplicated catalog products', () => {
  const products = [
    completeProduct(),
    completeProduct({
      id: 'p-2',
      nombre: 'glóbo azul',
      imagen_url: 'https://cdn.example.com/globo-azul.webp?width=500',
      marca: null,
    }),
    completeProduct({
      id: 'p-3',
      nombre: 'Producto incompleto',
      descripcion: '',
      imagen_url: '',
    }),
  ];

  const quality = analyzeCatalogQuality(products);

  assert.deepEqual(quality.summary, {
    total: 3,
    averageScore: 83,
    completeCount: 1,
    incompleteCount: 2,
    readyCount: 2,
    blockedCount: 1,
    duplicateCount: 2,
  });
  assert.equal(quality.issueCounts.duplicate_name, 2);
  assert.equal(quality.issueCounts.duplicate_image, 2);
  assert.equal(quality.byId.get('p-2').isComplete, false);
  assert.equal(quality.byId.get('p-3').isReadyToPublish, false);
});

test('analyzes a 1000-product catalog without truncating results', () => {
  const products = Array.from({ length: 1000 }, (_, index) => completeProduct({
    id: `p-${index}`,
    nombre: `Producto ${index}`,
    imagen_url: `https://cdn.example.com/producto-${index}.webp`,
  }));

  const quality = analyzeCatalogQuality(products);

  assert.equal(quality.summary.total, 1000);
  assert.equal(quality.summary.completeCount, 1000);
  assert.equal(quality.summary.duplicateCount, 0);
  assert.equal(quality.byId.size, 1000);
});

test('prioritizes blocked products in the correction queue', () => {
  const products = [
    completeProduct({
      id: 'duplicate',
      nombre: 'Producto completo',
      imagen_url: 'https://cdn.example.com/duplicate.webp',
    }),
    completeProduct({
      id: 'blocked-two',
      nombre: 'Sin datos',
      descripcion: '',
      categoria: '',
      marca: '',
      imagen_url: 'https://cdn.example.com/two.webp',
    }),
    completeProduct({
      id: 'blocked-one',
      nombre: 'Sin descripción',
      descripcion: '',
      imagen_url: 'https://cdn.example.com/one.webp',
    }),
    completeProduct({
      id: 'complete',
      nombre: 'Producto completo',
      imagen_url: 'https://cdn.example.com/other.webp',
    }),
  ];
  const analysis = analyzeCatalogQuality(products);
  const queue = buildCatalogCorrectionQueue(products, analysis.byId);

  assert.deepEqual(queue.slice(0, 2).map((product) => product.id), [
    'blocked-two',
    'blocked-one',
  ]);
  assert.deepEqual(
    new Set(queue.slice(2).map((product) => product.id)),
    new Set(['complete', 'duplicate']),
  );
});

test('returns an empty correction queue for a healthy catalog', () => {
  const products = [completeProduct()];
  const analysis = analyzeCatalogQuality(products);

  assert.deepEqual(buildCatalogCorrectionQueue(products, analysis.byId), []);
});
