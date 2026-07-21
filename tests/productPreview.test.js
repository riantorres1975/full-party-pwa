import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductPreviewHtml, escapeHtml } from '../api/product-preview.js';

test('escapes untrusted product data in preview metadata', () => {
  const html = buildProductPreviewHtml(
    {
      id: 'safe-id',
      nombre: '<script>alert("x")</script>',
      descripcion: 'Fiesta <b>grande</b>',
      imagen_url: 'javascript:alert(1)',
      precio: 85,
      marca: '</script><script>alert(1)</script>',
    },
    { siteOrigin: 'https://www.fullpartyuruapan.com.mx' },
  );

  assert.ok(!html.includes('<script>alert("x")</script>'));
  assert.ok(!html.includes('javascript:alert(1)'));
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /https:\/\/www\.fullpartyuruapan\.com\.mx\/og-image\.jpg/);
  assert.ok(!html.includes('</script><script>alert(1)</script>'));
});

test('renders product social metadata and redirects visitors to its catalog detail', () => {
  const html = buildProductPreviewHtml(
    {
      id: 42,
      nombre: 'Globo Azul',
      descripcion: 'Globo de latex',
      imagen_url: '/productos/globo.webp',
      precio: '85',
      marca: 'Glomex',
      activo: true,
      stock_ilimitado: false,
      stock_actual: 8,
    },
    { siteOrigin: 'https://www.fullpartyuruapan.com.mx' },
  );

  assert.match(html, /property="og:title" content="Globo Azul \| Full Party Uruapan"/);
  assert.match(html, /property="og:url" content="https:\/\/www\.fullpartyuruapan\.com\.mx\/p\/42"/);
  assert.match(html, /property="og:image" content="https:\/\/www\.fullpartyuruapan\.com\.mx\/productos\/globo\.webp"/);
  assert.match(html, /property="product:price:amount" content="85\.00"/);
  assert.match(html, /catalogo\?producto=42/);
  assert.match(html, /https:\/\/schema\.org\/InStock/);
});

test('renders a safe catalog fallback when a product is unavailable', () => {
  const html = buildProductPreviewHtml(null, {
    siteOrigin: 'https://www.fullpartyuruapan.com.mx',
  });

  assert.match(html, /Catálogo Full Party/);
  assert.match(html, /property="og:type" content="website"/);
  assert.ok(!html.includes('product:price:amount'));
  assert.match(html, /https:\/\/www\.fullpartyuruapan\.com\.mx\/catalogo/);
});

test('escapeHtml covers attribute-sensitive characters', () => {
  assert.equal(escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
});
