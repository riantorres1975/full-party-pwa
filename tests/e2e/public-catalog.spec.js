import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
  await availableProduct.click();

  const cartButton = page.locator('button[aria-label^="Carrito con "]');
  await expect(cartButton).toHaveAttribute('aria-label', /Carrito con 1/);
  await cartButton.click();

  const cart = page.getByRole('dialog');
  await expect(cart).toBeVisible();
  await expect(cart.getByText('1 producto · 1 pieza')).toBeVisible();
  await expect(cart.getByText(/Completa: nombre, teléfono válido/)).toBeVisible();
  await expect(cart.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();
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
