import { expect, test } from '@playwright/test';
import { loadEnv } from 'vite';

test.use({ actionTimeout: 8000 });

test('filters the full product list and resumes a draft at its next step', async ({ page }) => {
  const env = loadEnv('production', process.cwd(), 'VITE_ADMIN_EMAILS');
  const email = env.VITE_ADMIN_EMAILS?.split(',').map(value => value.trim()).find(Boolean) || 'admin@example.test';
  const userId = '33333333-3333-4333-8333-333333333333';
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = Buffer.from(JSON.stringify({ exp: expiresAt, sub: userId, role: 'authenticated' })).toString('base64url');
  const decoration = { id: '11111111-1111-4111-8111-111111111111', name: 'Decoración', active: true };
  const tableware = { id: '22222222-2222-4222-8222-222222222222', name: 'Desechables', active: true };
  const draft = { id: '44444444-4444-4444-8444-444444444444', name: 'Velas para fiesta', slug: 'velas-para-fiesta', category_id: decoration.id, active: false, variants: [] };
  const otherDraft = { ...draft, id: '55555555-5555-4555-8555-555555555555', name: 'Platos de colores', category_id: tableware.id };
  const published = Array.from({ length: 19 }, (_, index) => ({
    ...draft,
    id: `66666666-6666-4666-8666-${String(index).padStart(12, '0')}`,
    name: `Globo ${index + 1}`,
    slug: `globo-${index + 1}`,
    active: true,
  }));
  const products = [draft, otherDraft, ...published];
  let categoryReads = 0;
  let moreAttempts = 0;

  await page.route('**/auth/v1/token?**', route => route.fulfill({ json: {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${token}.local-test-signature`, refresh_token: 'local-test-refresh-token',
    token_type: 'bearer', expires_at: expiresAt, expires_in: 3600,
    user: { id: userId, email, app_metadata: { provider: 'email' }, user_metadata: {} },
  } }));
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1);
    const respond = (json, status = 200, headers = {}) => route.fulfill({ json, status, headers });
    if (table === 'profiles') return respond({ id: userId, email, nombre: 'Equipo de pruebas', role: 'admin', activo: true });
    if (table === 'catalog_categories') {
      categoryReads += 1;
      return respond([decoration, tableware]);
    }
    if (table !== 'catalog_products') return respond([]);

    const active = url.searchParams.get('active');
    const category = url.searchParams.get('category_id');
    const search = url.searchParams.get('or')?.match(/name\.ilike\.%([^%]+)%/)?.[1].toLowerCase();
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 18);
    if (offset > 0) {
      expect(active).toBe('eq.true');
      expect(category).toBe(`eq.${decoration.id}`);
      expect(search).toBe('globo');
      moreAttempts += 1;
      if (moreAttempts === 1) return respond({ message: 'Se interrumpió la carga' }, 400);
    }
    const matches = products.filter(product => (!active || active === `eq.${product.active}`)
      && (!category || category === `eq.${product.category_id}`)
      && (!search || product.name.toLowerCase().includes(search)));
    const rows = matches.slice(offset, offset + limit);
    return respond(rows, 200, {
      'access-control-expose-headers': 'content-range',
      'content-range': rows.length ? `${offset}-${offset + rows.length - 1}/${matches.length}` : '*/0',
    });
  });

  await page.goto('/admin/catalogo?estado=borradores');
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill('local-test-password');
  await page.locator('button[type="submit"]').click();

  const main = page.locator('#admin-main');
  const filters = main.getByRole('group', { name: 'Filtrar por estado de publicación' });
  const categories = main.getByRole('combobox', { name: 'Filtrar por categoría' });
  await expect(filters.getByRole('button', { name: 'Borradores' })).toHaveAttribute('aria-pressed', 'true');
  await expect(main.getByRole('heading', { name: otherDraft.name })).toBeVisible();
  await categories.selectOption(decoration.id);
  await expect(main.getByRole('heading', { name: otherDraft.name })).toHaveCount(0);
  const initialReads = categoryReads;
  const card = main.getByRole('article').filter({ hasText: draft.name });
  await expect(card.getByText('Agrega o activa una variante.')).toBeVisible();
  await card.getByRole('button', { name: 'Continuar borrador' }).click();
  const editor = page.getByRole('dialog', { name: draft.name });
  await expect(editor.getByRole('button', { name: 'Variantes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await editor.getByRole('button', { name: 'Agregar variante' }).click();
  const variantForm = page.getByRole('dialog', { name: 'Nueva variante' });
  await expect(variantForm.getByRole('button', { name: 'Cerrar formulario' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(variantForm).toHaveCount(0);
  await expect(editor).toBeVisible();

  await editor.getByRole('button', { name: 'Datos del producto' }).click();
  await editor.getByRole('textbox', { name: /^Nombre/ }).fill('Cambio temporal');
  await editor.getByRole('button', { name: 'Cerrar editor' }).click();
  const discard = page.getByRole('dialog', { name: 'Descartar cambios del producto' });
  await discard.getByRole('button', { name: 'Cancelar' }).click();
  await expect(editor.getByRole('textbox', { name: /^Nombre/ })).toHaveValue('Cambio temporal');
  await editor.getByRole('button', { name: 'Cerrar editor' }).click();
  await discard.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(editor).toHaveCount(0);

  await main.getByRole('searchbox', { name: 'Buscar producto por nombre' }).fill('Globo');
  await expect(main.getByRole('button', { name: 'Quitar filtros' })).toBeVisible();
  await filters.getByRole('button', { name: 'Publicados' }).click();
  await expect(main.getByRole('article')).toHaveCount(18);
  await main.getByRole('button', { name: /Cargar más/ }).click();
  await expect(main.getByRole('alert')).toContainText('No se pudieron cargar más productos.');
  await expect(main.getByRole('article')).toHaveCount(18);
  await main.getByRole('button', { name: 'Reintentar' }).click();
  await expect(main.getByRole('article')).toHaveCount(19);
  expect(categoryReads).toBe(initialReads);
});
