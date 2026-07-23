import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCategoryDraft,
  mergeCategoryStats,
  moveCategory,
  normalizeCategoryConfig,
  removeCategoryConfig,
  renameCategoryConfig,
  serializeCategoryConfig,
} from '../src/utils/categoryConfig.js';

test('normalizes category presentation values safely', () => {
  const config = normalizeCategoryConfig({
    items: [
      {
        id: 'Globo Latex',
        label: 'Globos de látex',
        description: 'Decoración para fiestas',
        imageUrl: ' https://example.com/globos.webp ',
        visible: false,
        order: 3,
      },
      { id: 'Globo Latex', label: 'Duplicada' },
      { id: '', label: 'Sin id' },
    ],
  });

  assert.deepEqual(config, [{
    id: 'Globo Latex',
    label: 'Globos de látex',
    description: 'Decoración para fiestas',
    imageUrl: 'https://example.com/globos.webp',
    visible: false,
    order: 3,
  }]);
});

test('merges order, visibility and visual metadata into public facets', () => {
  const stats = [
    { id: 'Globos', label: 'Globos', count: 12, imagen: 'auto-globos.webp' },
    { id: 'Confeti', label: 'Confeti', count: 4, imagen: 'auto-confeti.webp' },
    { id: 'Letras', label: 'Letras', count: 7, imagen: 'auto-letras.webp' },
  ];
  const config = {
    items: [
      { id: 'Letras', label: 'Letras luminosas', imageUrl: 'letras.webp', visible: true, order: 0 },
      { id: 'Globos', label: 'Globos', visible: false, order: 1 },
    ],
  };

  assert.deepEqual(mergeCategoryStats(stats, config), [
    {
      id: 'Letras',
      label: 'Letras luminosas',
      count: 7,
      imagen: 'letras.webp',
      description: '',
      visible: true,
      order: 0,
      hasCustomLabel: true,
    },
    {
      id: 'Confeti',
      label: 'Confeti',
      count: 4,
      imagen: 'auto-confeti.webp',
      description: '',
      visible: true,
      order: Number.MAX_SAFE_INTEGER,
      hasCustomLabel: false,
    },
  ]);
});

test('builds and maintains an editable category draft', () => {
  const products = [
    { categoria: 'Globos', imagen_url: 'globos.webp' },
    { categoria: 'Confeti', imagen_url: 'confeti.webp' },
  ];
  const draft = buildCategoryDraft(
    ['Globos', 'Confeti'],
    products,
    { items: [{ id: 'Confeti', label: 'Fiesta con confeti', order: 0 }] },
  );

  assert.equal(draft[0].id, 'Confeti');
  assert.equal(draft[0].fallbackImageUrl, 'confeti.webp');

  const moved = moveCategory(draft, 'Globos', -1);
  assert.equal(moved[0].id, 'Globos');
  assert.equal(moved[0].fallbackImageUrl, 'globos.webp');

  const renamed = renameCategoryConfig(moved, 'Globos', 'Globos Latex');
  assert.equal(renamed[0].id, 'Globos Latex');
  assert.equal(renamed[0].label, 'Globos Latex');

  const remaining = removeCategoryConfig(renamed, 'Confeti');
  assert.deepEqual(remaining.map(({ id }) => id), ['Globos Latex']);

  const serialized = serializeCategoryConfig(remaining);
  assert.equal(serialized.version, 1);
  assert.equal(serialized.items[0].order, 0);
  assert.equal('fallbackImageUrl' in serialized.items[0], false);
});
