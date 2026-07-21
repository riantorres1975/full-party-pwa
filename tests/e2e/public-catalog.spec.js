import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const catalogFixture = [
  { id: 'e2e-1', nombre: 'Globo Rosa 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 20, es_nuevo: true },
  { id: 'e2e-2', nombre: 'Globo Azul 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 18, es_nuevo: true },
  { id: 'e2e-3', nombre: 'Globo Verde 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 15, es_nuevo: false },
  { id: 'e2e-4', nombre: 'Globo Amarillo 12 Pulg', precio: 85, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', stock_actual: 12, es_nuevo: false },
  { id: 'e2e-5', nombre: 'Bomba Manual para Globos', precio: 45, categoria: 'Infladora de globos', marca: 'Económico', tamano: '', stock_actual: 4, es_nuevo: true },
  { id: 'e2e-6', nombre: 'Confeti Dorado', precio: 10, categoria: 'Confeti', marca: 'Genérico', tamano: '', stock_actual: 30, es_nuevo: false },
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

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/productos*', async (route) => {
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-expose-headers': 'content-range',
    };

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        ...corsHeaders,
        'content-range': `0-${catalogFixture.length - 1}/${catalogFixture.length}`,
      },
      body: JSON.stringify(catalogFixture),
    });
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
  expect(pageErrors).toEqual([]);
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
