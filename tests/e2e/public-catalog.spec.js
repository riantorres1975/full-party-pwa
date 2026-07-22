import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const catalogFixture = [
  { id: 'e2e-1', nombre: 'Globo Rosa 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 20, es_nuevo: true },
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

async function fulfillCatalogRequest(route, products) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: catalogCorsHeaders });
    return;
  }

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      ...catalogCorsHeaders,
      'content-range': products.length > 0 ? `0-${products.length - 1}/${products.length}` : '*/0',
    },
    body: JSON.stringify(products),
  });
}

test.beforeEach(async ({ page }) => {
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

  await search.fill('globo');
  await expect(search).toHaveValue('globo');
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

test('a 500-product catalog renders progressively without limiting search', async ({ page }) => {
  const largeCatalog = Array.from({ length: 500 }, (_, index) => ({
    ...catalogFixture[0],
    id: `scale-${index + 1}`,
    nombre: `Producto Escalable ${String(index + 1).padStart(3, '0')}`,
    descripcion: `Articulo ${index + 1} del catalogo de escala`,
    es_nuevo: false,
  }));
  let pageRequest = 0;

  await page.unroute('**/rest/v1/productos*');
  await page.route('**/rest/v1/productos*', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await fulfillCatalogRequest(route, []);
      return;
    }
    await fulfillCatalogRequest(route, pageRequest++ === 0 ? largeCatalog : []);
  });

  await page.goto('/catalogo');

  const cards = page.locator('article.product-card');
  await expect(page.getByText('500 productos', { exact: true })).toBeVisible();
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThan(500);

  const search = page.locator('input:visible').first();
  await search.fill('Producto Escalable 500');
  await expect(cards.getByRole('heading', { name: 'Producto Escalable 500' })).toBeVisible();
  expect(await cards.count()).toBeLessThan(500);

  await search.fill('');
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  const countBeforeMore = await cards.count();
  expect(countBeforeMore).toBeLessThan(500);

  const showMore = page.getByRole('button', { name: /Mostrar \d+ productos m.s/ });
  await expect(showMore).toBeAttached();
  await expect(showMore).toHaveCount(1);
  const automaticBatchCount = Number((await showMore.innerText()).match(/\d+/)?.[0]);
  await showMore.evaluate((button) => button.scrollIntoView({ block: 'center' }));
  await expect(cards).toHaveCount(countBeforeMore + automaticBatchCount);

  const countBeforeManualLoad = await cards.count();
  const manualBatchCount = Number((await showMore.innerText()).match(/\d+/)?.[0]);
  await showMore.evaluate((button) => button.click());
  await expect(cards).toHaveCount(countBeforeManualLoad + manualBatchCount);
  expect(await cards.count()).toBeLessThan(500);
});

test('an empty catalog is distinguished from a search without results', async ({ page }) => {
  await page.unroute('**/rest/v1/productos*');
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

test('a product detail is shareable and supports shopping without closing', async ({ page }) => {
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
