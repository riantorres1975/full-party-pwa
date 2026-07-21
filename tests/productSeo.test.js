import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductSeo } from '../src/utils/productSeo.js';

test('builds a canonical product URL without preserving catalog filters', () => {
  const metadata = buildProductSeo(
    {
      id: 42,
      nombre: 'Globo Azul',
      descripcion: 'Globo latex para decoracion',
      precio: 85,
    },
    {
      pageUrl: 'https://fullpartyuruapan.com.mx/catalogo?categoria=globos&buscar=azul',
      imageUrl: '/productos/globo-azul.webp',
    },
  );

  assert.equal(metadata.title, 'Globo Azul | Full Party Uruapan');
  assert.equal(metadata.description, 'Globo latex para decoracion');
  assert.equal(metadata.canonicalUrl, 'https://fullpartyuruapan.com.mx/catalogo?producto=42');
  assert.equal(metadata.imageUrl, 'https://fullpartyuruapan.com.mx/productos/globo-azul.webp');
  assert.equal(metadata.price, '85.00');
});

test('uses a concise fallback description for products without one', () => {
  const metadata = buildProductSeo(
    { id: 'abc', nombre: '  Bomba   Manual  ', precio: null },
    { pageUrl: 'https://fullpartyuruapan.com.mx/' },
  );

  assert.equal(metadata.title, 'Bomba Manual | Full Party Uruapan');
  assert.equal(
    metadata.description,
    'Bomba Manual. Consulta precio y disponibilidad en Full Party Uruapan.',
  );
  assert.equal(metadata.price, '');
});
