import { expect, test } from '@playwright/test';
import { loadEnv } from 'vite';

const categoryId = '11111111-1111-4111-8111-111111111111';
const locationId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';

test('registers a priced product with a photo and retries publishing its existing draft', async ({ page }) => {
  const env = loadEnv('production', process.cwd(), 'VITE_ADMIN_EMAILS');
  const email = env.VITE_ADMIN_EMAILS?.split(',').map((item) => item.trim()).find(Boolean) || 'admin@example.test';
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const fakeToken = Buffer.from(JSON.stringify({ exp: expiresAt, sub: userId, role: 'authenticated' })).toString('base64url');
  let draft = null;
  let commercialRow = null;
  let inserts = 0;
  let commercialWrites = 0;
  let uploads = 0;
  let publishAttempts = 0;

  await page.route('**/auth/v1/token?**', (route) => route.fulfill({
    json: {
      access_token: `eyJhbGciOiJIUzI1NiJ9.${fakeToken}.local-test-signature`,
      refresh_token: 'local-test-refresh-token',
      token_type: 'bearer',
      expires_at: expiresAt,
      expires_in: 3600,
      user: { id: userId, email, app_metadata: { provider: 'email' }, user_metadata: {} },
    },
  }));
  await page.route('**/storage/v1/object/productos-imagenes/catalogo/**', (route) => {
    uploads += 1;
    return route.fulfill({ json: { Key: new URL(route.request().url()).pathname } });
  });
  await page.route('**/storage/v1/object/public/productos-imagenes/catalogo/**', (route) => route.fulfill({
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+i8xoAAAAASUVORK5CYII=', 'base64'),
    contentType: 'image/png',
  }));

  await page.route('**/rest/v1/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split('/').at(-1);
    const respond = (json, status = 200, headers = {}) => route.fulfill({ json, status, headers });
    if (path === 'profiles') return respond({ id: userId, email, nombre: 'Equipo de pruebas', role: 'admin', activo: true });
    if (path === 'catalog_categories') return respond([{ id: categoryId, name: 'Decoración', active: true }]);
    if (path === 'catalog_locations') return respond([{ id: locationId, name: 'Sucursal de prueba', slug: 'francisco-villa', active: true }]);

    if (path === 'catalog_admin_apply_commercial_rows') {
      const { p_product_id, p_rows } = request.postDataJSON();
      expect(p_product_id).toBe(draft.id);
      expect(draft.active).toBe(false);
      commercialWrites += 1;
      commercialRow = p_rows[0];
      draft.variants = [{
        id: '44444444-4444-4444-8444-444444444444',
        active: true,
        presentations: [{ id: '55555555-5555-4555-8555-555555555555', ...commercialRow.presentation }],
      }];
      return respond({ results: [{ status: 'created' }] });
    }

    if (path === 'catalog_products') {
      if (request.method() === 'POST') {
        inserts += 1;
        draft = { ...request.postDataJSON(), variants: [] };
        return respond({ id: draft.id }, 201);
      }
      if (request.method() === 'PATCH') {
        const payload = request.postDataJSON();
        if (payload.active) {
          publishAttempts += 1;
          if (publishAttempts === 1) return respond({ message: 'La publicación se interrumpió. Inténtalo de nuevo.' }, 409);
        }
        draft = { ...draft, ...payload };
        return respond({ id: draft.id });
      }
      const matching = draft && (!url.searchParams.has('id') || url.searchParams.get('id') === `eq.${draft.id}`);
      return respond(matching ? [draft] : [], 200, { 'content-range': matching ? '0-0/1' : '*/0' });
    }

    return respond([]);
  });

  await page.goto('/admin/catalogo');
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill('local-test-password');
  await page.locator('button[type="submit"]').click();

  await page.getByRole('button', { name: 'Nuevo producto' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo producto' });
  const publish = dialog.getByRole('button', { name: 'Publicar producto' });
  await expect(dialog.getByLabel('Nombre del producto')).toBeFocused();

  await publish.click();
  await expect(dialog.getByText('Elige una categoría.')).toBeVisible();
  expect(inserts).toBe(0);

  await dialog.getByLabel('Nombre del producto').fill('Velas doradas');
  await dialog.getByLabel('Categoría').selectOption(categoryId);
  await dialog.getByLabel('¿Cómo lo vendes?').selectOption('paquete');
  await dialog.getByLabel('Piezas que contiene').fill('6');
  await dialog.getByLabel('Precio por paquete (MXN)').fill('49,50');
  await dialog.getByLabel('Envases o paquetes disponibles').fill('18');
  await dialog.getByLabel('Foto del producto (opcional)').setInputFiles({
    name: 'velas.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+i8xoAAAAASUVORK5CYII=', 'base64'),
  });
  await dialog.getByText('Agregar marca, descripción o mayoreo', { exact: true }).click();
  await dialog.getByLabel('Ofrecer un precio de mayoreo').check();
  await dialog.getByLabel('¿Desde cuántas se aplica?').fill('12');
  await dialog.getByLabel('Precio de mayoreo por paquete (MXN)').fill('40');
  await publish.click();
  await expect(dialog.getByRole('alert')).toContainText('Reintenta la publicación');
  await expect(dialog.getByLabel('Precio por paquete (MXN)')).toBeDisabled();
  expect(draft.active).toBe(false);
  expect(draft.main_image_url).toContain('/principal.png');

  await dialog.getByRole('button', { name: 'Reintentar publicación' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Velas doradas' })).toBeVisible();
  expect(draft.active).toBe(true);
  expect(inserts).toBe(1);
  expect(uploads).toBe(1);
  expect(commercialWrites).toBe(1);
  expect(publishAttempts).toBe(2);
  expect(commercialRow.presentation).toMatchObject({ name: 'Paquete con 6 piezas', base_price: 49.5, base_units_total: 6 });
  expect(commercialRow.variant).toMatchObject({ inventory_policy: 'separate_by_presentation' });
  expect(commercialRow.inventory).toMatchObject({ quantity: 18, location_id: locationId });
  expect(commercialRow.tier).toMatchObject({ minimum_quantity: 12, price_per_presentation: 40 });
});
