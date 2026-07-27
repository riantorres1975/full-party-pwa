import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminCatalogDraft,
  normalizeAdminCatalogPayload,
  slugifyCatalogValue,
  validateAdminCatalogPayload,
} from '../src/services/catalog/adminCatalogModel.js';

test('slugifyCatalogValue normaliza acentos y simbolos', () => {
  assert.equal(slugifyCatalogValue('  Globos Látex / 12"  '), 'globos-latex-12');
  assert.equal(slugifyCatalogValue('Rosa   Pastel'), 'rosa-pastel');
});

test('createAdminCatalogDraft aplica defaults del recurso', () => {
  const draft = createAdminCatalogDraft('collections');
  assert.equal(draft.collection_type, 'editorial');
  assert.equal(draft.sort_order, 0);
  assert.equal(draft.active, true);
});

test('normalizeAdminCatalogPayload genera slug y limpia opcionales', () => {
  const payload = normalizeAdminCatalogPayload('brands', {
    name: '  Sempertex México ',
    slug: '',
    logo_url: ' ',
    description: '',
    sort_order: '4',
    active: true,
  });

  assert.deepEqual(payload, {
    name: 'Sempertex México',
    slug: 'sempertex-mexico',
    logo_url: null,
    description: null,
    sort_order: 4,
    active: true,
  });
});

test('validateAdminCatalogPayload exige relaciones obligatorias', () => {
  const result = validateAdminCatalogPayload('lines', {
    name: 'Pastel',
    slug: 'pastel',
    brand_id: '',
    finish_type: '',
    description: '',
    image_url: '',
    sort_order: 0,
    active: true,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.brand_id, 'Marca es obligatorio.');
});

test('validateAdminCatalogPayload evita categorias autocontenidas', () => {
  const result = validateAdminCatalogPayload(
    'categories',
    {
      name: 'Globos',
      slug: 'globos',
      parent_id: 'cat-1',
      description: '',
      image_url: '',
      icon: '',
      sort_order: 0,
      active: true,
    },
    { entityId: 'cat-1' },
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.parent_id, /no puede depender/);
});

test('validateAdminCatalogPayload valida HEX y fechas', () => {
  const color = validateAdminCatalogPayload('colors', {
    exact_name: 'Rosa',
    slug: 'rosa',
    color_family_id: 'family-1',
    hex_value: '#GG00FF',
    swatch_image_url: '',
    internal_code: '',
    active: true,
  });
  assert.equal(color.errors.hex_value, 'Usa un color HEX de seis digitos.');

  const collection = validateAdminCatalogPayload('collections', {
    name: 'Navidad',
    slug: 'navidad',
    description: '',
    collection_type: 'temporada',
    image_url: '',
    start_date: '2026-12-25T10:00',
    end_date: '2026-12-01T10:00',
    sort_order: 0,
    active: true,
  });
  assert.equal(collection.valid, false);
  assert.match(collection.errors.end_date, /posterior/);
});

test('validateAdminCatalogPayload exige valor en unidades numericas', () => {
  const numeric = validateAdminCatalogPayload('sizes', {
    name: 'Doce pulgadas',
    numeric_value: '',
    unit: 'pulgada',
    sort_order: 0,
    active: true,
  });
  assert.equal(numeric.valid, false);
  assert.match(numeric.errors.numeric_value, /mayor que cero/);

  const commercial = validateAdminCatalogPayload('sizes', {
    name: 'Tamaño grande',
    numeric_value: '',
    unit: 'comercial',
    sort_order: 0,
    active: true,
  });
  assert.equal(commercial.valid, true);
});
