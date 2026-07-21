import assert from 'node:assert/strict';
import test from 'node:test';
import productPreviewHandler, {
  buildProductCatalogUrl,
  buildProductPreviewHtml,
  escapeHtml,
  shouldServePreviewHtml,
} from '../api/product-preview.js';

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

test('distinguishes social crawlers from interactive browsers', () => {
  assert.equal(shouldServePreviewHtml('facebookexternalhit/1.1'), true);
  assert.equal(shouldServePreviewHtml('WhatsApp/2.24.7 Android'), true);
  assert.equal(shouldServePreviewHtml('Twitterbot/1.0'), true);
  assert.equal(
    shouldServePreviewHtml('Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile Safari/537.36'),
    false,
  );
  assert.equal(
    shouldServePreviewHtml('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'),
    false,
  );
  assert.equal(shouldServePreviewHtml('Dalvik/2.1.0 (Linux; Android 13)'), false);
  assert.equal(shouldServePreviewHtml('curl/8.0'), true);
});

test('builds a safe catalog destination for a shared product', () => {
  assert.equal(
    buildProductCatalogUrl('product-42', 'https://www.fullpartyuruapan.com.mx'),
    'https://www.fullpartyuruapan.com.mx/catalogo?producto=product-42',
  );
});

test('redirects interactive browsers before fetching product metadata', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('The browser redirect must not query Supabase');
  };
  const headers = new Map();
  const response = {
    statusCode: 200,
    ended: false,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    end() {
      this.ended = true;
      return this;
    },
  };

  try {
    await productPreviewHandler({
      method: 'GET',
      query: { id: 'product-42' },
      headers: { 'user-agent': 'Mozilla/5.0 Chrome/126.0 Mobile Safari/537.36' },
    }, response);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(response.statusCode, 307);
  assert.equal(response.ended, true);
  assert.equal(fetchCalled, false);
  assert.equal(
    headers.get('location'),
    'https://www.fullpartyuruapan.com.mx/catalogo?producto=product-42',
  );
  assert.equal(headers.get('cache-control'), 'private, no-store');
  assert.equal(headers.get('cdn-cache-control'), 'no-store');
});
