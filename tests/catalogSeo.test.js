import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCatalogCategoryMeta } from '../src/utils/catalogSeo.js';

test('builds metadata for a curated category route', () => {
  const meta = buildCatalogCategoryMeta('/catalogo/globos-latex');

  assert.equal(meta.title, 'Globos de Látex al Mayoreo en Uruapan | Full Party Uruapan');
  assert.match(meta.description, /globos de látex al mayoreo y menudeo/i);
  assert.equal(meta.canonical, 'https://www.fullpartyuruapan.com.mx/catalogo/globos-latex');
});

test('builds readable metadata for a dynamic Supabase category', () => {
  const meta = buildCatalogCategoryMeta('/catalogo/primera-comunion');

  assert.equal(meta.title, 'Primera Comunión al Mayoreo en Uruapan | Full Party Uruapan');
  assert.equal(meta.canonical, 'https://www.fullpartyuruapan.com.mx/catalogo/primera-comunion');
});

test('uses the canonical route for a supported alias', () => {
  const meta = buildCatalogCategoryMeta('/catalogo/globos-numeros');

  assert.equal(meta.canonical, 'https://www.fullpartyuruapan.com.mx/catalogo/globos-numero');
});

test('ignores catalog root and nested paths', () => {
  assert.equal(buildCatalogCategoryMeta('/catalogo'), null);
  assert.equal(buildCatalogCategoryMeta('/catalogo/globos/azules'), null);
});
