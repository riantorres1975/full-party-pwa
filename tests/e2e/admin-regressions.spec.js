import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const hasAdminCredentials = Boolean(adminEmail && adminPassword);

async function openAuthenticatedCatalog(page) {
  await page.goto('/admin/catalogo');

  const emailInput = page.locator('#admin-email');
  if (await emailInput.isVisible()) {
    await emailInput.fill(adminEmail);
    await page.locator('#admin-password').fill(adminPassword);
    await page.locator('button[type="submit"]').click();
  }

  await expect(page.locator('#admin-main')).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin\/catalogo/);
}

test.describe('authenticated admin V2 regressions', () => {
  test.skip(!hasAdminCredentials, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests.');

  test('auxiliary catalogs keep navigation, forms and shell stable', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openAuthenticatedCatalog(page);

    const main = page.locator('#admin-main');
    await expect(main.getByRole('heading', { name: 'Base del catalogo V2' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Categorias', exact: true })).toBeVisible();
    await expect(main).toBeVisible();

    const brandsButton = main.getByRole('button', { name: /Marcas/ });
    await expect(brandsButton).toBeVisible();
    await brandsButton.click();
    await expect(page).toHaveURL(/seccion=brands/);
    await expect(main.getByRole('heading', { name: 'Marcas', exact: true })).toBeVisible();

    const createButton = main.getByRole('button', { name: 'Nueva marca' });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Nueva marca' })).toBeVisible();
      await page.getByRole('button', { name: 'Cerrar formulario' }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
    }

    const isDesktop = (page.viewportSize()?.width || 0) >= 1024;
    if (isDesktop) {
      const sidebar = page.locator('aside').filter({ has: page.getByRole('navigation', { name: 'Catalogos auxiliares' }) });
      await expect(sidebar).toBeVisible();
      const bounds = await sidebar.boundingBox();
      expect(bounds?.height).toBeGreaterThan(300);
    } else {
      await expect(page.getByRole('navigation', { name: 'Catalogos auxiliares' })).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });
});
