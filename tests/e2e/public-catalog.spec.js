import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const productId = '11111111-1111-4111-8111-111111111111';
const variantId = '22222222-2222-4222-8222-222222222222';
const presentationId = '33333333-3333-4333-8333-333333333333';
const image = '/icons/icon-192.png';

const categories = [{
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Globos',
  slug: 'globos',
  parent_id: null,
  description: 'Globos para toda ocasion',
  image_url: image,
  icon: 'balloon',
  sort_order: 1,
}];

const card = {
  group_key: `${productId}:glomex-estandar`,
  product_id: productId,
  product_name: 'Globo Latex Glomex',
  product_slug: 'globo-latex-glomex',
  short_description: 'Bolsa de globos profesionales',
  brand_name: 'Glomex',
  brand_slug: 'glomex',
  line_id: '55555555-5555-4555-8555-555555555555',
  line_name: 'Estandar',
  line_slug: 'glomex-estandar',
  image_url: image,
  min_price: 85,
  color_count: 1,
  line_count: 1,
  variant_count: 1,
  presentation_count: 1,
  sizes: [{ id: '66666666-6666-4666-8666-666666666666', name: '12 pulgadas' }],
  colors: [{ slug: 'rojo', name: 'Rojo', hex: '#ef4444' }],
  presentation_types: ['bolsa'],
  in_stock: true,
  featured: true,
  is_new: true,
};

const detail = {
  product: {
    id: productId,
    name: 'Globo Latex Glomex',
    slug: 'globo-latex-glomex',
    short_description: 'Bolsa con 100 piezas',
    description: 'Globo profesional para decoracion.',
    main_image_url: image,
    listing_group_mode: 'line',
    featured: true,
    is_new: true,
    brand: { id: '77777777-7777-4777-8777-777777777777', name: 'Glomex', slug: 'glomex' },
    category: categories[0],
  },
  breadcrumb: [{ id: categories[0].id, name: 'Globos', slug: 'globos' }],
  lines: [{
    id: card.line_id,
    name: 'Estandar',
    slug: 'glomex-estandar',
    colors: [{ color_id: '88888888-8888-4888-8888-888888888888', exact_name: 'Rojo', slug: 'rojo', hex: '#ef4444' }],
  }],
  sizes: [{ id: card.sizes[0].id, name: '12 pulgadas', numeric_value: 12, unit: 'pulgada' }],
  variants: [{
    id: variantId,
    line_id: card.line_id,
    line_name: 'Estandar',
    line_slug: 'glomex-estandar',
    color_id: '88888888-8888-4888-8888-888888888888',
    color_name: 'Rojo',
    color_slug: 'rojo',
    color_hex: '#ef4444',
    size_id: card.sizes[0].id,
    size_name: '12 pulgadas',
    image_url: image,
    inventory_policy: 'shared_base_units',
    presentations: [{
      id: presentationId,
      variant_id: variantId,
      name: 'Bolsa con 100 piezas',
      presentation_type: 'bolsa',
      base_unit: 'pieza',
      base_units_total: 100,
      base_price: 85,
      minimum_order_quantity: 1,
      quantity_step: 1,
      available_quantity: 50,
      in_stock: true,
      tiers: [{ minimum_quantity: 12, maximum_quantity: null, price_per_presentation: 78, label: 'Mayoreo' }],
    }],
  }],
  images: [],
  attributes: [],
  related: [],
};

const facets = {
  brands: [{ slug: 'glomex', name: 'Glomex', count: 1 }],
  lines: [{ slug: 'glomex-estandar', name: 'Estandar', count: 1 }],
  color_families: [{ slug: 'rojos', name: 'Rojos', count: 1 }],
  colors: [{ slug: 'rojo', name: 'Rojo', hex: '#ef4444', count: 1 }],
  sizes: [{ id: card.sizes[0].id, name: '12 pulgadas', count: 1 }],
  finishes: [],
  price: { min: 85, max: 85 },
  availability: { in_stock: 1, out_of_stock: 0 },
};

async function mockCatalogV2(page) {
  const requests = [];
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(url.pathname);

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }

    let body = [];
    if (url.pathname.endsWith('/catalog_categories')) body = categories;
    if (url.pathname.endsWith('/catalog_collections')) body = [];
    if (url.pathname.endsWith('/rpc/catalog_list_cards')) {
      const params = request.postDataJSON();
      const matches = !params.p_search
        || card.product_name.toLowerCase().includes(String(params.p_search).toLowerCase());
      body = { cards: matches ? [card] : [], total: matches ? 1 : 0, limit: 24, offset: 0 };
    }
    if (url.pathname.endsWith('/rpc/catalog_get_facets')) body = facets;
    if (url.pathname.endsWith('/rpc/catalog_get_product_detail')) body = detail;
    if (url.pathname.endsWith('/rpc/catalog_validate_cart')) {
      body = { valid: true, issues: [], lines: [], total: 85 };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  });
  return requests;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('renders the V2 catalog and searches through the canonical RPC', async ({ page }) => {
  const requests = await mockCatalogV2(page);
  await page.goto('/catalogo');

  await expect(page.getByRole('heading', { name: /Cat.logo completo/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Globo Latex Glomex/ })).toBeVisible();
  await expect(page.getByText('Desde').first()).toBeVisible();

  await page.getByRole('searchbox', { name: /Buscar en el cat.logo/ }).fill('Glomex');
  await expect(page).toHaveURL(/q=Glomex/);
  await expect.poll(() => requests.filter((path) => path.endsWith('/rpc/catalog_list_cards')).length).toBeGreaterThan(1);
  expect(requests.some((path) => path.endsWith('/productos'))).toBe(false);
});

test('opens a V2 product, applies tier information and adds it to the order', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo?gama=glomex-estandar');

  await page.locator('article').getByRole('button', { name: 'Ver producto' }).click();
  const dialog = page.getByRole('dialog', { name: 'Globo Latex Glomex' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Bolsa con 100 piezas').first()).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Precios por cantidad' })).toBeVisible();

  await dialog.getByRole('button', { name: /Agregar al pedido/ }).click();
  await dialog.getByRole('button', { name: 'Regresar' }).click();
  const mobile = page.viewportSize()?.width < 820;
  if (mobile) {
    await expect(page.getByRole('alert')).toBeHidden({ timeout: 10_000 });
  }
  const cartNavigation = mobile
    ? page.locator('.catalog-v2-bottom-nav')
    : page.locator('.catalog-v2-header__actions');
  await cartNavigation.getByRole('button', { name: 'Mi pedido' }).click();
  const cart = page.getByRole('dialog', { name: 'Mi pedido' });
  await expect(cart.getByText('Globo Latex Glomex')).toBeVisible();
  await expect(cart.getByRole('heading', { name: /Qui.n recibe el pedido/ })).toBeVisible();
});

test('has no serious accessibility violations in the catalog results', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: /Globo Latex Glomex/ })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
});
