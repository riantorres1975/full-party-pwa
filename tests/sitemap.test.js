import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CATEGORY_ROUTE_RULES } from '../src/utils/categoryRoutes.js';

const SITE_URL = 'https://www.fullpartyuruapan.com.mx';

test('sitemap includes every canonical catalog category and excludes private routes', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');

  for (const { slug } of CATEGORY_ROUTE_RULES) {
    assert.match(sitemap, new RegExp(`<loc>${SITE_URL}/catalogo/${slug}</loc>`));
  }

  assert.doesNotMatch(sitemap, /\/admin(?:<|\/)/);
  assert.doesNotMatch(sitemap, /catalogo\/globos-numeros/);
  assert.doesNotMatch(sitemap, /catalogo\/personajes/);
});
