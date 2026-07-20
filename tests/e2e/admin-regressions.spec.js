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

test.describe('authenticated admin regressions', () => {
  test.skip(!hasAdminCredentials, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests.');

  test('selection and scrolling keep the admin shell visible', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openAuthenticatedCatalog(page);

    const main = page.locator('#admin-main');
    const firstProductCheckbox = main.locator('input[type="checkbox"]').first();

    await expect(firstProductCheckbox).toBeVisible({ timeout: 20_000 });
    await firstProductCheckbox.check();
    await expect(firstProductCheckbox).toBeChecked();
    await expect(main.getByRole('toolbar')).toBeVisible();
    await expect(main).toBeVisible();

    await main.evaluate((element) => element.scrollTo({ top: 1_000, behavior: 'instant' }));
    await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    const isDesktop = (page.viewportSize()?.width || 0) >= 1024;
    if (isDesktop) {
      const sidebar = page.locator('aside').first();
      await expect(sidebar).toBeVisible();
      const bounds = await sidebar.boundingBox();
      expect(bounds?.top).toBe(0);
      expect(bounds?.height).toBeGreaterThan(500);
    } else {
      await expect(page.locator('nav').last()).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });
});
