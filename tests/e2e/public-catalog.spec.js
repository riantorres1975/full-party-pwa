import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const catalogFixture = [
  {
    id: 'e2e-1',
    nombre: 'Globo Rosa 12 Pulg',
    descripcion: 'Globo rosa de alta calidad, resistente y versátil para arcos, columnas y decoraciones de cualquier celebración.',
    precio: 85,
    categoria: 'Globo Latex',
    marca: 'Glomex',
    tamano: '12 Pulg',
    stock_actual: 20,
    es_nuevo: true,
  },
  { id: 'e2e-2', nombre: 'Globo Azul 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 18, es_nuevo: true },
  { id: 'e2e-3', nombre: 'Globo Verde 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 15, es_nuevo: false },
  { id: 'e2e-4', nombre: 'Globo Amarillo 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 12, es_nuevo: false },
  { id: 'e2e-5', nombre: 'Bomba Manual para Globos', precio: 45, categoria: 'Infladora de globos', marca: 'Económico', tamano: '', stock_actual: 4, es_nuevo: true },
  { id: 'e2e-6', nombre: 'Confeti Dorado', precio: 10, categoria: 'Confeti', marca: 'Genérico', tamano: '', stock_actual: 30, es_nuevo: false },
  { id: 'e2e-7', nombre: 'Globo Número Azul 0', precio: 25, categoria: 'Globo Número-16', marca: 'Genérico', tamano: '16 Pulg', stock_actual: 8, es_nuevo: false },
].map((producto) => ({
  descripcion: `${producto.nombre} para pruebas del catálogo`,
  imagen_url: '/icons/icon-192.png',
  activo: true,
  stock_ilimitado: false,
  precios_mayoreo: [{ cantidad_minima: 12, precio: Math.max(1, producto.precio - 5) }],
  ...producto,
}));

const readAnalyticsEvents = (page) => page.evaluate(() => (
  (window.dataLayer || [])
    .map((entry) => Array.from(entry))
    .filter(([command]) => command === 'event')
    .map(([, name, params]) => ({ name, params: params || {} }))
));

const catalogCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-expose-headers': 'content-range',
};

function parseInFilter(value) {
  if (!value?.startsWith('in.(')) return [];
  return value
    .slice(4, -1)
    .split(',')
    .map((item) => item.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"'));
}

function filterCatalogRequest(url, products) {
  const params = url.searchParams;
  let filtered = [...products];

  [
    ['id', 'id'],
    ['categoria', 'categoria'],
    ['marca', 'marca'],
    ['tamano', 'tamano'],
  ].forEach(([parameter, field]) => {
    const allowed = parseInFilter(params.get(parameter));
    if (allowed.length > 0) {
      filtered = filtered.filter((product) => allowed.includes(String(product[field] ?? '')));
    }
  });

  params.getAll('precio').forEach((filter) => {
    const [operator, rawValue] = filter.split('.');
    const value = Number(rawValue);
    if (operator === 'gte') filtered = filtered.filter((product) => Number(product.precio) >= value);
    if (operator === 'lte') filtered = filtered.filter((product) => Number(product.precio) <= value);
  });

  const searchExpression = params.get('or') || '';
  const pattern = searchExpression.match(/nombre\.ilike\.\*([^,]*)\*/)?.[1];
  if (pattern) {
    const terms = pattern.toLocaleLowerCase('es').split('*').filter(Boolean);
    filtered = filtered.filter((product) => {
      const text = [
        product.nombre,
        product.descripcion,
        product.categoria,
        product.marca,
        product.tamano,
      ].join(' ').toLocaleLowerCase('es');
      return terms.every((term) => text.includes(term));
    });
  }

  const offset = Number(params.get('offset')) || 0;
  const limit = Number(params.get('limit')) || filtered.length;
  return {
    page: filtered.slice(offset, offset + limit),
    offset,
    total: filtered.length,
  };
}

async function fulfillCatalogRequest(route, products) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: catalogCorsHeaders });
    return;
  }

  const { page, offset, total } = filterCatalogRequest(
    new URL(route.request().url()),
    products,
  );
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      ...catalogCorsHeaders,
      'content-range': page.length > 0 ? `${offset}-${offset + page.length - 1}/${total}` : `*/${total}`,
    },
    body: JSON.stringify(page),
  });
}

function buildCatalogFacets(products) {
  const rows = [];
  ['categoria', 'marca', 'tamano'].forEach((dimension) => {
    const values = new Map();
    products.forEach((product) => {
      const value = product[dimension];
      if (!value) return;
      const current = values.get(value) || { count: 0, image: null };
      current.count += 1;
      current.image ||= product.imagen_url || null;
      values.set(value, current);
    });
    values.forEach(({ count, image }, value) => rows.push({
      dimension,
      valor: value,
      cantidad: count,
      precio_min: null,
      precio_max: null,
      imagen: dimension === 'categoria' ? image : null,
    }));
  });
  const prices = products.map(({ precio }) => Number(precio)).filter(Number.isFinite);
  rows.push({
    dimension: 'resumen',
    valor: 'catalogo',
    cantidad: products.length,
    precio_min: prices.length > 0 ? Math.min(...prices) : null,
    precio_max: prices.length > 0 ? Math.max(...prices) : null,
    imagen: null,
  });
  return rows;
}

async function fulfillFacetRequest(route, products) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: catalogCorsHeaders });
    return;
  }
  const rows = buildCatalogFacets(products);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      ...catalogCorsHeaders,
      'content-range': rows.length > 0 ? `0-${rows.length - 1}/${rows.length}` : '*/0',
    },
    body: JSON.stringify(rows),
  });
}

async function fulfillConfigRequest(route, values = {}) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: catalogCorsHeaders });
    return;
  }

  const filter = new URL(route.request().url()).searchParams.get('clave') || '';
  const key = filter.startsWith('eq.') ? filter.slice(3) : '';
  const hasValue = Object.prototype.hasOwnProperty.call(values, key);
  const body = hasValue ? [{ valor: values[key] }] : [];

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      ...catalogCorsHeaders,
      'content-range': hasValue ? '0-0/1' : '*/0',
    },
    body: JSON.stringify(body),
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/configuracion*', async (route) => {
    await fulfillConfigRequest(route, {
      anuncio: { mensaje: '', activo: false },
      pedidos_habilitados: true,
    });
  });
  await page.route('**/rest/v1/catalogo_facetas_publicas*', async (route) => {
    await fulfillFacetRequest(route, catalogFixture);
  });
  await page.route('**/rest/v1/productos*', async (route) => {
    await fulfillCatalogRequest(route, catalogFixture);
  });
});

test('the landing page presents a clear path to shop on every viewport', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  const hero = page.locator('section[aria-labelledby="hero-heading"]');
  const branchAnimation = hero.locator('.lp-branch-lockup');
  const catalogCta = hero.getByRole('button', { name: 'Explorar productos' });
  const whatsappCta = hero.getByRole('link', { name: 'Cotizar por WhatsApp' });

  await expect(branchAnimation).toBeVisible();
  await expect(branchAnimation).toContainText('Full Party');
  await expect(catalogCta).toBeVisible();
  await expect(whatsappCta).toHaveAttribute('href', /wa\.me/);
  await expect(hero.getByText('4.7 en Google')).toBeVisible();
  await expect(hero.getByText('Compra desde 1 pieza')).toBeVisible();

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);

  await catalogCta.click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect.poll(async () => (
    (await readAnalyticsEvents(page)).filter(({ name, params }) => (
      name === 'page_view' && params.page_path === '/catalogo'
    )).length
  )).toBe(1);
  expect(pageErrors).toEqual([]);
});

test('the landing proof remains contained at the tablet breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 710, height: 820 });
  await page.goto('/');

  const layout = await page.locator('.lp-hero-proof').evaluate((proof) => {
    const proofRect = proof.getBoundingClientRect();
    const items = [...proof.querySelectorAll('.lp-proof-item')];

    return {
      columns: getComputedStyle(proof).gridTemplateColumns.split(' ').length,
      itemsContained: items.every((item) => {
        const itemRect = item.getBoundingClientRect();
        return itemRect.left >= proofRect.left && itemRect.right <= proofRect.right;
      }),
    };
  });

  expect(layout.columns).toBe(2);
  expect(layout.itemsContained).toBe(true);
});

test('the public catalog remains usable without horizontal overflow', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__catalogCls = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__catalogCls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // LayoutShift is not available in every browser engine.
    }
  });

  await page.goto('/catalogo');

  const main = page.locator('main');
  const search = page.locator('input:visible').first();

  await expect(main).toBeVisible();
  await expect(search).toBeVisible();
  await expect.poll(() => main.locator('button').count()).toBeGreaterThan(0);

  if ((page.viewportSize()?.width || 0) < 1024) {
    const categoryImages = page.getByTestId('category-image');
    await expect.poll(() => categoryImages.count()).toBeGreaterThan(0);
    await expect(categoryImages.first().locator('img')).toHaveAttribute('src', '/icons/icon-192.png');
  }

  await search.fill('globo');
  await expect(search).toHaveValue('globo');
  if ((page.viewportSize()?.width || 0) >= 1024) {
    const activeFilters = page.getByLabel('Filtros activos');
    await expect(activeFilters).toBeVisible();
    await expect(activeFilters.getByRole('button', { name: 'Quitar filtro "globo"' })).toBeVisible();
  }
  await expect.poll(async () => (
    (await readAnalyticsEvents(page)).some(({ name }) => name === 'catalog_search')
  )).toBe(true);
  const searchEvent = (await readAnalyticsEvents(page)).find(({ name }) => name === 'catalog_search');
  expect(searchEvent.params).toMatchObject({ query_length: 5, has_results: true });
  expect(searchEvent.params).not.toHaveProperty('search_term');
  await search.fill('');

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);
  expect(await page.evaluate(() => window.__catalogCls)).toBeLessThanOrEqual(0.1);
  expect(pageErrors).toEqual([]);
});

test('category presentation controls labels, order and visibility', async ({ page }) => {
  await page.unroute('**/rest/v1/configuracion*');
  await page.route('**/rest/v1/configuracion*', async (route) => {
    await fulfillConfigRequest(route, {
      anuncio: { mensaje: '', activo: false },
      pedidos_habilitados: true,
      catalogo_categorias: {
        version: 1,
        items: [
          {
            id: 'Infladora de globos',
            label: 'Bombas e infladores',
            description: 'Infla tus globos con menos esfuerzo.',
            imageUrl: '/icons/icon-192.png',
            visible: true,
            order: 0,
          },
          {
            id: 'Confeti',
            label: 'Confeti',
            description: '',
            imageUrl: '',
            visible: false,
            order: 1,
          },
        ],
      },
    });
  });

  await page.goto('/catalogo');

  if ((page.viewportSize()?.width || 0) < 1024) {
    const categoryCards = page.getByTestId('category-card');
    await expect(categoryCards.first()).toContainText('Bombas e infladores');
    await expect(categoryCards.filter({ hasText: /^Confeti/ })).toHaveCount(0);
  } else {
    const firstCategory = page.locator('[data-category-filter="Infladora de globos"]');
    await expect(firstCategory).toBeVisible();
    await expect(firstCategory).toContainText('Bombas e infladores');
    await expect(page.locator('[data-category-filter="Confeti"]')).toHaveCount(0);
  }

  await page.goto('/catalogo/infladora-de-globos');
  await expect(page.getByText('Infla tus globos con menos esfuerzo.')).toBeVisible();
});

test('a 1000-product catalog renders progressively without limiting search', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const maxProgressiveCards = 200;
  const largeCatalog = Array.from({ length: 1000 }, (_, index) => ({
    ...catalogFixture[0],
    id: `scale-${index + 1}`,
    nombre: `Producto Escalable ${String(index + 1).padStart(3, '0')}`,
    descripcion: `Articulo ${index + 1} del catalogo de escala`,
    es_nuevo: false,
  }));
  await page.unroute('**/rest/v1/productos*');
  await page.unroute('**/rest/v1/catalogo_facetas_publicas*');
  await page.route('**/rest/v1/catalogo_facetas_publicas*', async (route) => {
    await fulfillFacetRequest(route, largeCatalog);
  });
  await page.route('**/rest/v1/productos*', async (route) => {
    await fulfillCatalogRequest(route, largeCatalog);
  });

  await page.goto('/catalogo');

  const cards = page.locator('article.product-card');
  await expect(page.getByText('1000 productos', { exact: true })).toBeVisible();
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(maxProgressiveCards);

  const search = page.locator('input:visible').first();
  await search.fill('Producto Escalable 1000');
  await expect(cards.getByRole('heading', { name: 'Producto Escalable 1000' })).toBeVisible();
  expect(await cards.count()).toBeLessThanOrEqual(maxProgressiveCards);

  await search.fill('');
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  await page.waitForTimeout(1_200);
  const countBeforeMore = await cards.count();
  expect(countBeforeMore).toBeLessThanOrEqual(maxProgressiveCards);

  const sentinel = page.locator('[data-catalog-load-sentinel]');
  await expect(sentinel).toBeAttached();
  await sentinel.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await expect.poll(() => cards.count()).toBeGreaterThan(countBeforeMore);
  expect(await cards.count()).toBeLessThanOrEqual(maxProgressiveCards);
  await expect(page.getByRole('button', { name: /Mostrar \d+ productos m.s/ })).toHaveCount(0);
  const cachedPage = await page.evaluate(() => {
    const cache = JSON.parse(localStorage.getItem('fp_catalog_pages_v2') || '{}');
    return {
      complete: cache.complete,
      length: cache.data?.length || 0,
      totalCount: cache.totalCount,
    };
  });
  expect(cachedPage.totalCount).toBe(1000);
  expect(cachedPage.complete).toBe(false);
  expect(cachedPage.length).toBeGreaterThan(0);
  expect(cachedPage.length).toBeLessThanOrEqual(200);

  if ((page.viewportSize()?.width || 0) >= 1024) {
    const scrollRoot = page.locator('[data-catalog-scroll-root]');
    await expect.poll(() => scrollRoot.evaluate((node) => node.scrollTop)).toBeGreaterThan(700);

    const lastVisibleProduct = cards.last().locator('.product-card-detail-trigger');
    await lastVisibleProduct.scrollIntoViewIfNeeded();
    await lastVisibleProduct.click();
    const productDetail = page.getByRole('dialog');
    await expect(productDetail).toBeVisible();
    const scrollWithDetail = await scrollRoot.evaluate((node) => node.scrollTop);
    expect(scrollWithDetail).toBeGreaterThan(700);
    await page.keyboard.press('Escape');
    await expect(productDetail).toBeHidden();
    await expect.poll(async () => Math.abs(
      (await scrollRoot.evaluate((node) => node.scrollTop)) - scrollWithDetail,
    )).toBeLessThanOrEqual(100);

    const backToTop = page.getByRole('button', { name: 'Volver arriba' });
    await expect(backToTop).toBeVisible();
    await backToTop.click();
    await expect.poll(() => scrollRoot.evaluate((node) => node.scrollTop)).toBeLessThan(10);
  }
  expect(pageErrors).toEqual([]);
});

test('an empty catalog is distinguished from a search without results', async ({ page }) => {
  await page.unroute('**/rest/v1/productos*');
  await page.unroute('**/rest/v1/catalogo_facetas_publicas*');
  await page.route('**/rest/v1/catalogo_facetas_publicas*', async (route) => {
    await fulfillFacetRequest(route, []);
  });
  await page.route('**/rest/v1/productos*', async (route) => {
    await fulfillCatalogRequest(route, []);
  });

  await page.goto('/catalogo');

  await expect(page.getByRole('heading', { name: 'Catálogo en preparación' })).toBeVisible();
  await expect(page.getByText('Aún no hay productos disponibles. Vuelve a intentarlo más tarde.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sin resultados' })).toHaveCount(0);
});

test('category URLs filter products and stay in sync with navigation', async ({ page }) => {
  await page.goto('/catalogo/globos-latex');

  await expect(page).toHaveURL(/\/catalogo\/globos-latex$/);
  await expect(page.getByText('Viendo: Globos de Látex')).toBeVisible();
  await expect(page.locator('article.product-card')).toHaveCount(4);
  await expect(page).toHaveTitle('Globos de Látex al Mayoreo en Uruapan | Full Party Uruapan');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.fullpartyuruapan.com.mx/catalogo/globos-latex',
  );
  const categorySchema = await page.locator('#route-jsonld').textContent();
  expect(JSON.parse(categorySchema)['@graph'][0]).toMatchObject({
    '@type': 'BreadcrumbList',
    itemListElement: [
      expect.objectContaining({ position: 1, name: 'Full Party Uruapan' }),
      expect.objectContaining({ position: 2, name: 'Catálogo' }),
      expect.objectContaining({ position: 3, name: 'Globos de Látex' }),
    ],
  });

  await page.getByRole('button', { name: 'Quitar filtros' }).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByText(`${catalogFixture.length} productos`, { exact: true })).toBeVisible();

  await page.locator('button:visible').filter({ hasText: /^Confeti$/ }).first().click();
  await expect(page).toHaveURL(/\/catalogo\/confeti$/);
  await expect(page.locator('article.product-card')).toHaveCount(1);
  await expect(page).toHaveTitle('Confeti al Mayoreo en Uruapan | Full Party Uruapan');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.fullpartyuruapan.com.mx/catalogo/confeti',
  );

  await page.goBack();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByText(`${catalogFixture.length} productos`, { exact: true })).toBeVisible();

  await page.goto('/catalogo/globos-numeros');
  await expect(page).toHaveURL(/\/catalogo\/globos-numero$/);
  await expect(page.locator('article.product-card')).toHaveCount(1);
});

test('the catalog can be sorted and the cart guides order completion', async ({ page }) => {
  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);

  const sort = page.locator('#catalog-sort');
  await sort.selectOption('price-asc');
  await expect(sort).toHaveValue('price-asc');

  const availableProduct = page
    .locator('article.product-card button[aria-label^="Agregar "][aria-label$=" al carrito"]:not([disabled])')
    .first();
  await expect(availableProduct).toBeVisible();
  const selectedProductName = await availableProduct
    .locator('xpath=ancestor::article')
    .locator('h3')
    .innerText();
  await availableProduct.click();

  const cartButton = page.locator('button[aria-label^="Carrito con "]');
  await expect(cartButton).toHaveAttribute('aria-label', /Carrito con 1/);
  await cartButton.click();

  const cart = page.getByRole('dialog');
  await expect(cart).toBeVisible();
  await expect(cart.getByText('1 producto · 1 pieza')).toBeVisible();
  await expect(cart.getByText(/Completa: nombre, teléfono válido/)).toBeVisible();
  await expect(cart.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();

  await cart.getByLabel('Nombre completo').fill('María Prueba');
  await cart.getByLabel('Número de teléfono').fill('4521234567');
  const cartPanel = page.locator('[role="dialog"][aria-label="🎁 Mi Pedido"]');
  await cart.getByRole('button', { name: 'Cerrar carrito' }).click();
  await expect(cartPanel).toHaveAttribute('aria-hidden', 'true');

  await cartButton.click();
  await expect(cart.getByLabel('Nombre completo')).toHaveValue('María Prueba');
  await expect(cart.getByLabel('Número de teléfono')).toHaveValue('4521234567');

  const reviewButton = cart.getByRole('button', { name: 'Revisar pedido' });
  await expect(reviewButton).toBeEnabled();
  await reviewButton.click();
  await expect(cart.getByText('¡Pedido listo!')).toBeVisible();
  await expect(cart.getByText(selectedProductName, { exact: true })).toBeVisible();
  await expect(cart.getByText('María Prueba', { exact: true })).toBeVisible();
  await expect(cart.getByText(/Precios y disponibilidad verificados/)).toBeVisible();
  await expect(cart.getByRole('button', { name: '← Editar pedido' })).toBeVisible();

  const eventNames = (await readAnalyticsEvents(page)).map(({ name }) => name);
  expect(eventNames).toEqual(expect.arrayContaining([
    'catalog_add_to_cart',
    'cart_view',
    'checkout_review',
  ]));
});

test('an offline checkout stays intact until the connection returns', async ({ page, context }) => {
  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);

  await page
    .locator('article.product-card button[aria-label^="Agregar "][aria-label$=" al carrito"]:not([disabled])')
    .first()
    .click();
  await page.locator('button[aria-label^="Carrito con "]').click();

  const cart = page.getByRole('dialog');
  await cart.getByLabel('Nombre completo').fill('María Prueba');
  await cart.getByLabel('Número de teléfono').fill('4521234567');
  await cart.getByRole('button', { name: 'Revisar pedido' }).click();
  await expect(cart.getByText('¡Pedido listo!')).toBeVisible();

  await context.setOffline(true);
  await expect(cart.getByText(/Tu pedido sigue guardado/)).toBeVisible();
  await expect(cart.getByRole('button', { name: 'Enviar pedido a Full Party' })).toBeDisabled();
  await expect(cart.getByText('1 producto · 1 pieza')).toBeVisible();

  await context.setOffline(false);
  await expect(cart.getByText(/Tu pedido sigue guardado/)).toBeHidden();
  await expect(cart.getByRole('button', { name: 'Enviar pedido a Full Party' })).toBeEnabled();
});

test('a completed order includes its folio and tracking URL in WhatsApp', async ({ page, context }) => {
  const folio = 'FP-E2E1234';
  let createPayload = null;

  await page.route('**/rest/v1/rpc/crear_pedido_publico', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: { ...catalogCorsHeaders, 'access-control-allow-methods': 'POST, OPTIONS' },
      });
      return;
    }

    createPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: catalogCorsHeaders,
      body: JSON.stringify(folio),
    });
  });
  await context.route('https://api.whatsapp.com/send**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>WhatsApp</title>',
    });
  });

  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);
  await page
    .locator('article.product-card button[aria-label^="Agregar "][aria-label$=" al carrito"]:not([disabled])')
    .first()
    .click();
  await page.locator('button[aria-label^="Carrito con "]').click();

  const cart = page.getByRole('dialog');
  await cart.getByLabel('Nombre completo').fill('Maria E2E');
  await cart.getByLabel(/N.mero de tel.fono/i).fill('4521234567');
  await cart.getByRole('button', { name: 'Revisar pedido' }).click();

  const popupPromise = page.waitForEvent('popup');
  const whatsappRequestPromise = context.waitForEvent('request', {
    predicate: (request) => (
      request.isNavigationRequest()
      && request.url().startsWith('https://api.whatsapp.com/send')
    ),
    timeout: 10_000,
  });
  await cart.getByRole('button', { name: 'Enviar pedido a Full Party' }).click();
  await popupPromise;

  const whatsappRequest = await whatsappRequestPromise;
  const whatsappUrl = whatsappRequest.url();
  const message = new URL(whatsappUrl).searchParams.get('text');

  expect(createPayload).toEqual(expect.objectContaining({
    p_cliente_nombre: 'Maria E2E',
    p_cliente_telefono: '4521234567',
    p_tipo_entrega: 'tienda',
  }));
  expect(createPayload.p_detalles_json).toHaveLength(1);
  expect(message).toContain(`Folio:* ${folio}`);
  expect(message).toContain(`https://www.fullpartyuruapan.com.mx/rastrear/${folio}`);
  await expect(page.locator('button[aria-label^="Carrito con 0"]')).toBeVisible();
});

test('a direct tracking URL loads the saved order status', async ({ page }) => {
  const folio = 'FP-E2E1234';
  let lookupPayload = null;

  await page.route('**/rest/v1/rpc/buscar_pedido_por_folio', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: { ...catalogCorsHeaders, 'access-control-allow-methods': 'POST, OPTIONS' },
      });
      return;
    }

    lookupPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: catalogCorsHeaders,
      body: JSON.stringify([{
        folio,
        cliente_nombre: 'Maria E2E',
        estado: 'Por Surtir',
        total: 85,
        tipo_entrega: 'tienda',
        created_at: '2026-07-22T15:00:00.000Z',
        updated_at: '2026-07-22T15:00:00.000Z',
        detalles_json: [{ nombre: 'Globo Rosa 12 Pulg', cantidad: 1, precio: 85 }],
      }]),
    });
  });

  await page.goto(`/rastrear/${folio.toLowerCase()}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Rastrear Pedido' })).toBeVisible();
  await expect(page.getByText(folio, { exact: true })).toBeVisible();
  await expect(page.getByText('Maria E2E', { exact: true })).toBeVisible();
  await expect(page.getByText('Por Surtir', { exact: true })).toBeVisible();
  expect(lookupPayload).toEqual({ p_folio: folio });
});

test('favorites and recently viewed products persist across reloads', async ({ page }) => {
  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);

  const firstProduct = page.locator('article.product-card').first();
  const productName = await firstProduct.locator('h3').innerText();
  await firstProduct.getByRole('button', { name: `Agregar ${productName} a favoritos` }).click();
  await expect(
    firstProduct.getByRole('button', { name: `Quitar ${productName} de favoritos` }),
  ).toBeVisible();

  const favoritesFilter = page.getByRole('button', { name: 'Mostrar 1 favoritos' });
  await favoritesFilter.click();
  await expect(page.locator('article.product-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ver todos los productos' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Ver todos los productos' }).click();
  await firstProduct.locator('.product-card-detail-trigger').click();
  const detail = page.getByRole('dialog', { name: `Ver detalle de ${productName}` });
  await expect(detail).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(detail).toBeHidden();
  await expect(page).not.toHaveURL(/[?&]producto=/);

  const recentlyViewed = page.getByRole('region', { name: 'Vistos recientemente' });
  await expect(recentlyViewed).toBeVisible();
  await expect(
    recentlyViewed.getByRole('button', { name: `Abrir ${productName} visto recientemente` }),
  ).toBeVisible();

  const favoriteEvent = (await readAnalyticsEvents(page)).find(({ name }) => name === 'favorite_toggle');
  expect(favoriteEvent.params).toMatchObject({ source: 'card', is_favorite: true });

  await page.reload();
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);
  const restoredProduct = page.locator('article.product-card').filter({ hasText: productName });
  await expect(
    restoredProduct.getByRole('button', { name: `Quitar ${productName} de favoritos` }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: `Abrir ${productName} visto recientemente` }),
  ).toBeVisible();

  expect((await readAnalyticsEvents(page)).filter(({ name }) => name === 'favorite_toggle')).toHaveLength(0);
});

test('a product detail is shareable and supports shopping without closing', async ({ page }, testInfo) => {
  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);
  const catalogTitle = await page.title();
  const catalogCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');

  const firstProduct = page.locator('article.product-card').first();
  const productName = await firstProduct.locator('h3').innerText();
  await firstProduct.locator('button').first().click();

  await expect(page).toHaveURL(/[?&]producto=/);
  const productUrl = page.url();
  let detail = page.getByRole('dialog', { name: `Ver detalle de ${productName}`, exact: true });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('heading', { name: productName })).toBeVisible();
  await expect.poll(async () => (
    (await readAnalyticsEvents(page)).some(({ name }) => name === 'catalog_product_view')
  )).toBe(true);
  await expect(page).toHaveTitle(`${productName} | Full Party Uruapan`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', productUrl);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    `${productName} | Full Party Uruapan`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', productUrl);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect.poll(() => detail.evaluate((dialog) => document.activeElement === dialog)).toBe(true);
  await expect(detail.getByRole('button', { name: 'Compartir' })).toBeVisible();
  await expect(detail.getByText('Precios por mayoreo', { exact: true })).toHaveCount(0);
  await expect(detail.locator('section[aria-labelledby="related-products-title"] button').first()).toBeVisible();
  const description = detail.locator('[id^="product-description-"]');
  await expect(description).toBeVisible();
  const showMoreButton = detail.getByRole('button', { name: 'Ver más' });
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(showMoreButton).toBeVisible();
    await expect(showMoreButton).toHaveAttribute('aria-expanded', 'false');
    await showMoreButton.click();
    await expect(detail.getByRole('button', { name: 'Ver menos' })).toHaveAttribute('aria-expanded', 'true');
  } else {
    await expect(showMoreButton).toBeHidden();
  }
  const statusLayout = await detail.evaluate((dialog) => {
    const actions = dialog.querySelector('[data-testid="product-detail-actions"]')?.getBoundingClientRect();
    const badges = dialog.querySelector('[data-testid="product-status-badges"]')?.getBoundingClientRect();
    if (!actions || !badges) return { overlap: false };
    return {
      overlap: !(
        actions.right <= badges.left ||
        actions.left >= badges.right ||
        actions.bottom <= badges.top ||
        actions.top >= badges.bottom
      ),
    };
  });
  expect(statusLayout.overlap).toBe(false);

  await page.keyboard.press('Escape');
  await expect(detail).toBeHidden();
  await expect(page).toHaveTitle(catalogTitle);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', catalogCanonical);
  await expect.poll(() => firstProduct.locator('button').first().evaluate(
    (button) => getComputedStyle(button).outlineStyle,
  )).toBe('none');

  await firstProduct.locator('button').first().click();
  detail = page.getByRole('dialog', { name: `Ver detalle de ${productName}`, exact: true });
  await expect(detail).toBeVisible();
  await expect.poll(() => detail.evaluate((dialog) => document.activeElement === dialog)).toBe(true);
  await expect(detail.getByRole('button', { name: 'Compartir' })).not.toBeFocused();

  await page.goto(productUrl);
  detail = page.getByRole('dialog', { name: `Ver detalle de ${productName}`, exact: true });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('heading', { name: productName })).toBeVisible();

  await detail.getByRole('button', { name: 'Agregar al carrito' }).click();
  await expect(detail).toBeVisible();
  await expect(detail.getByLabel('1 pieza en tu pedido')).toBeVisible();
  await expect(page).toHaveURL(productUrl);
});

test('the admin route presents an accessible login when signed out', async ({ page }) => {
  await page.goto('/admin/catalogo');

  await expect(page.locator('#admin-email')).toBeVisible();
  await expect(page.locator('#admin-password')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', '');
  await expect(page.locator('#route-jsonld')).toHaveCount(0);
});

test('the branches route publishes both stores as structured data', async ({ page }) => {
  await page.goto('/sucursales');

  await expect(page.getByRole('heading', { name: 'Encuéntranos en Uruapan' })).toBeVisible();
  const data = JSON.parse(await page.locator('#route-jsonld').textContent());
  const stores = data['@graph'].filter((entry) => entry['@type'] === 'Store');

  expect(stores).toHaveLength(2);
  expect(stores.map(({ name }) => name)).toEqual([
    'Full Party Uruapan Suc. Francisco Villa',
    'Full Party Uruapan Suc. Sol Naciente',
  ]);
  await expect(page.locator('#francisco-villa')).toBeVisible();
  await expect(page.locator('#sol-naciente')).toBeVisible();
});

test('the PWA exposes a valid manifest and registers its service worker', async ({ page, request }) => {
  const manifestResponse = await request.get('/manifest.json');
  expect(manifestResponse.ok()).toBe(true);

  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe('/catalogo');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192' }),
    expect.objectContaining({ sizes: '512x512' }),
  ]));
  expect(manifest.shortcuts).toEqual(expect.arrayContaining([
    expect.objectContaining({ url: '/catalogo' }),
    expect.objectContaining({ url: '/rastrear' }),
    expect.objectContaining({ url: '/sucursales' }),
  ]));

  await page.goto('/catalogo');
  await expect.poll(
    () => page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.some((registration) => (
        registration.active || registration.waiting || registration.installing
      ));
    }),
    { timeout: 15_000 }
  ).toBe(true);
});

test('the installed catalog reloads from its app shell while offline', async ({ page, context }) => {
  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);
  await expect.poll(
    () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    { timeout: 15_000 }
  ).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('fp_catalog_pages_v2'))?.data?.length || 0;
    } catch {
      return 0;
    }
  })).toBeGreaterThan(0);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Sin conexi/i).first()).toBeVisible();
    await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);
  } finally {
    await context.setOffline(false);
  }
});

test('the public catalog has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/catalogo');
  await expect.poll(() => page.locator('article.product-card').count()).toBeGreaterThan(0);

  const results = await new AxeBuilder({ page }).analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target),
  }));

  expect(results.violations, JSON.stringify(summary, null, 2)).toEqual([]);
});

const publicContentRoutes = [
  { path: '/sucursales', heading: /Encu[eé]ntranos en Uruapan/i },
  { path: '/como-funciona', heading: /C[oó]mo hacer un pedido/i },
  { path: '/destacados', heading: /Categor[ií]as destacadas/i },
  { path: '/blog', heading: /Blog Full Party/i },
  {
    path: '/blog/cuantos-globos-necesito-cumpleanos',
    heading: /Cu[aá]ntos globos necesito para decorar un cumplea[nñ]os/i,
  },
];

for (const route of publicContentRoutes) {
  test(`${route.path} remains responsive and accessible`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(route.path);

    const heading = page.getByRole('heading', { level: 1, name: route.heading });
    await expect(heading).toBeVisible();
    if (route.path === '/sucursales') {
      await expect(page.locator('iframe[title^="Mapa Suc."]')).toHaveCount(2);
    }

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);

    // Third-party map frames own their internal landmarks; audit the app shell
    // while still asserting that each iframe has an accessible title.
    const results = await new AxeBuilder({ page }).exclude('iframe').analyze();
    const summary = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));

    expect(results.violations, JSON.stringify(summary, null, 2)).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
