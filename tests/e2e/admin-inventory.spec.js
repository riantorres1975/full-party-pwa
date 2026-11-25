import { expect, test } from '@playwright/test';
import { loadEnv } from 'vite';

test('finds stock by branch and SKU and reviews newer reservations before saving', async ({ page }) => {
  const env = loadEnv('production', process.cwd(), 'VITE_ADMIN_EMAILS');
  const email = env.VITE_ADMIN_EMAILS?.split(',').map(item => item.trim()).find(Boolean) || 'admin@example.test';
  const userId = '33333333-3333-4333-8333-333333333333';
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = Buffer.from(JSON.stringify({ exp: expiresAt, sub: userId, role: 'authenticated' })).toString('base64url');
  const villa = { id: '11111111-1111-4111-8111-111111111111', name: 'Francisco Villa', slug: 'francisco-villa' };
  const sol = { id: '22222222-2222-4222-8222-222222222222', name: 'Sol Naciente', slug: 'sol-naciente' };
  const firstVersion = '2026-08-01T15:00:00+00:00';
  const newerVersion = '2026-08-01T15:05:00+00:00';
  let row = {
    id: '44444444-4444-4444-8444-444444444444',
    variant_id: '55555555-5555-4555-8555-555555555555',
    location_id: villa.id,
    location: villa,
    quantity: 8,
    reserved_quantity: 4,
    low_stock_threshold: 4,
    updated_at: firstVersion,
    variant: { sku: 'BAL-ROSA-12', product: { name: 'Globo redondo' }, color: { exact_name: 'Rosa' } },
  };
  const otherBranch = {
    ...row, id: '66666666-6666-4666-8666-666666666666', location_id: sol.id, location: sol, quantity: 18, reserved_quantity: 0,
  };
  const soldOut = {
    ...otherBranch, id: '77777777-7777-4777-8777-777777777777',
    quantity: 3, reserved_quantity: 3, variant: { sku: 'BOMBA-01', product: { name: 'Bomba manual' } },
  };
  const writes = [];

  await page.route('**/auth/v1/token?**', route => route.fulfill({
    json: {
      access_token: `eyJhbGciOiJIUzI1NiJ9.${token}.local-test-signature`, refresh_token: 'local-test-refresh-token',
      token_type: 'bearer', expires_at: expiresAt, expires_in: 3600,
      user: { id: userId, email, app_metadata: { provider: 'email' }, user_metadata: {} },
    },
  }));
  await page.route('**/rest/v1/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split('/').at(-1);
    const respond = (json, status = 200) => route.fulfill({ status, json });
    if (table === 'profiles') return respond({ id: userId, email, nombre: 'Equipo de pruebas', role: 'admin', activo: true });
    if (table !== 'catalog_inventory') return respond([]);
    if (request.method() === 'PATCH') {
      writes.push(request.postDataJSON());
      if (writes.length === 1) {
        expect(url.searchParams.get('updated_at')).toBe(`eq.${firstVersion}`);
        expect(url.searchParams.get('reserved_quantity')).toBe('eq.4');
        row = { ...row, quantity: 9, reserved_quantity: 6, low_stock_threshold: 5, updated_at: newerVersion };
        return respond({ code: 'PGRST116', details: 'The result contains 0 rows', message: 'Cannot coerce the result to a single JSON object' }, 406);
      }
      expect(url.searchParams.get('id')).toBe(`eq.${row.id}`);
      expect(url.searchParams.get('updated_at')).toBe(`eq.${newerVersion}`);
      expect(url.searchParams.get('reserved_quantity')).toBe('eq.6');
      row = { ...row, ...request.postDataJSON() };
      return respond(row);
    }
    return respond(url.searchParams.has('id') ? [row] : [row, otherBranch, soldOut]);
  });

  await page.goto('/admin/dashboard');
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill('local-test-password');
  await page.locator('button[type="submit"]').click();
  await page.getByRole('link', { name: /Alertas de inventario.*2/i }).click();

  await expect(page).toHaveURL(/filtro=alertas/);
  const filters = page.getByRole('group', { name: 'Filtrar por estado de existencia' });
  await expect(filters.getByRole('button', { name: 'Por reponer 2' })).toHaveAttribute('aria-pressed', 'true');
  const rows = page.getByRole('region', { name: 'Resultados de inventario' }).getByRole('listitem');
  await expect(rows).toHaveCount(2);
  const search = page.getByRole('searchbox', { name: 'Buscar por nombre, variante o SKU' });
  await filters.getByRole('button', { name: 'Todos 3' }).click();
  await search.fill('BAL-ROSA-12');
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Sol Naciente' })).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Filtrar por sucursal' }).selectOption(villa.id);
  await filters.getByRole('button', { name: 'Por reponer 1' }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Francisco Villa');

  const edit = rows.first().getByRole('button', { name: /Ajustar existencia/ });
  const dialog = page.getByRole('dialog', { name: 'Ajustar existencia' });
  const physical = dialog.getByRole('textbox', { name: 'Existencia física' });
  const minimum = dialog.getByRole('textbox', { name: 'Mínimo de alerta' });
  const save = dialog.getByRole('button', { name: 'Guardar cambios' });
  await edit.click();
  await expect(physical).toBeFocused();
  await physical.fill('12');
  await minimum.focus();
  await minimum.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(writes).toHaveLength(0);

  await edit.click();
  await physical.fill('3,5');
  await save.click();
  await expect(dialog.getByRole('alert')).toContainText('Hay 4 reservadas para pedidos');
  expect(writes).toHaveLength(0);

  await physical.fill('12,250');
  await save.click();
  await expect(dialog.getByRole('alert')).toContainText('La existencia cambió mientras la editabas.');
  await expect(physical).toHaveValue('12,250');
  await expect(minimum).toHaveValue('5');
  await expect(dialog.getByText('Cantidad disponible al guardar: 6.25')).toBeVisible();
  await save.click();
  await expect(dialog).toHaveCount(0);
  await expect(rows).toHaveCount(0);
  await expect(search).toBeFocused();
  expect(writes).toEqual([{ quantity: 12.25 }, { quantity: 12.25 }]);

  await filters.getByRole('button', { name: 'Todos 1' }).click();
  await expect(rows.first()).toContainText('Existencia suficiente');
  await expect(rows.first()).toContainText('12.25');
});
