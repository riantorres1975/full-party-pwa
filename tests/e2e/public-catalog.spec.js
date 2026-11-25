import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const productId = '11111111-1111-4111-8111-111111111111';
const variantId = '22222222-2222-4222-8222-222222222222';
const presentationId = '33333333-3333-4333-8333-333333333333';
const pastelLineId = '99999999-9999-4999-8999-999999999999';
const pastelColorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const pastelVariantId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const pastelPresentationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
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
  lines: [
    {
      id: card.line_id,
      name: 'Estandar',
      slug: 'glomex-estandar',
      colors: [{ color_id: '88888888-8888-4888-8888-888888888888', exact_name: 'Rojo', slug: 'rojo', hex: '#ef4444' }],
    },
    {
      id: pastelLineId,
      name: 'Pastel',
      slug: 'glomex-pastel',
      colors: [{ color_id: pastelColorId, exact_name: 'Azul pastel', slug: 'azul-pastel', hex: '#93c5fd' }],
    },
  ],
  sizes: [{ id: card.sizes[0].id, name: '12 pulgadas', numeric_value: 12, unit: 'pulgada' }],
  variants: [
    {
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
    },
    {
      id: pastelVariantId,
      line_id: pastelLineId,
      line_name: 'Pastel',
      line_slug: 'glomex-pastel',
      color_id: pastelColorId,
      color_name: 'Azul pastel',
      color_slug: 'azul-pastel',
      color_hex: '#93c5fd',
      size_id: card.sizes[0].id,
      size_name: '12 pulgadas',
      image_url: image,
      inventory_policy: 'shared_base_units',
      presentations: [{
        id: pastelPresentationId,
        variant_id: pastelVariantId,
        name: 'Bolsa con 100 piezas',
        presentation_type: 'bolsa',
        base_unit: 'pieza',
        base_units_total: 100,
        base_price: 85,
        minimum_order_quantity: 1,
        quantity_step: 1,
        available_quantity: 50,
        in_stock: true,
        tiers: [],
      }],
    },
  ],
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

async function mockCatalogV2(page, { listing = [card], productDetail = detail } = {}) {
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
      const matches = listing.filter((candidate) => !params.p_search
        || candidate.product_name.toLowerCase().includes(String(params.p_search).toLowerCase()));
      body = { cards: matches, total: matches.length, limit: 24, offset: 0 };
    }
    if (url.pathname.endsWith('/rpc/catalog_get_facets')) body = facets;
    if (url.pathname.endsWith('/rpc/catalog_get_product_detail')) body = productDetail;
    if (url.pathname.endsWith('/rpc/catalog_create_order')) {
      body = { folio: 'FP-PRUEBA-001', total: 85 };
    }
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

test('keeps home navigation visible and opens the store section below it', async ({ page }) => {
  await mockCatalogV2(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://www.google.com/maps/**', (route) => route.fulfill({ body: '<title>Mapa</title>' }));
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Todo para tu próxima fiesta.');
  const heroImage = page.locator('.lp-hero-media img');
  await expect.poll(() => heroImage.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('clip', 'auto');
  await expect(skipLink).toHaveCSS('position', 'fixed');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('link', { name: '2 sucursales en Uruapan' }).click();
  await expect(page).toHaveURL(/#sucursales$/);

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect.poll(() => nav.evaluate((element) => element.getBoundingClientRect().top)).toBe(0);
  const branchSection = page.locator('#sucursales');
  await expect(branchSection.getByRole('heading', { name: 'Nuestras Sucursales' })).toBeInViewport();
  const mapsLinks = await branchSection.getByRole('link', { name: 'Ver en Google Maps' }).evaluateAll(
    (links) => links.map((link) => link.getAttribute('href')),
  );
  expect(mapsLinks).toHaveLength(2);
  expect(new Set(mapsLinks).size).toBe(2);
  mapsLinks.forEach((href) => expect(href).toMatch(/^https:\/\//));
});

test('opens a catalog search from home and keeps the query', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/');

  const categories = page.getByRole('region', { name: 'Compra por categoría' });
  await expect(categories.getByRole('link', { name: 'Ver todo el catálogo', exact: true })).toHaveCount(1);
  await expect(categories.getByRole('link', { name: /Globos de figuras/ })).toHaveAttribute('href', '/catalogo/globos/globos-figuras');

  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('  Glomex  ');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page).toHaveURL(/\/catalogo\?q=Glomex$/);
  await expect(page.getByRole('searchbox', { name: /Buscar en el cat.logo/ })).toHaveValue('Glomex');
  await expect(page.getByRole('heading', { name: /Globo Latex Glomex/ })).toBeVisible();
});

test('closes the mobile home menu with Escape and restores focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The mobile menu is only shown at narrow widths');
  await mockCatalogV2(page);
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  await toggle.click();
  const menu = page.locator('#public-site-mobile-menu');
  await expect(menu).toBeVisible();

  await menu.getByRole('link', { name: 'Catálogo' }).focus();
  await page.keyboard.press('Escape');

  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('renders the V2 catalog and searches through the canonical RPC', async ({ page }) => {
  const requests = await mockCatalogV2(page);
  await page.goto('/catalogo');

  await expect(page.getByRole('heading', { name: /Cat.logo completo/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Globo Latex Glomex/ })).toBeVisible();
  await expect(page.locator('article').getByText('$85.00')).toBeVisible();
  const cardAction = page.locator('article').getByRole('button', { name: 'Ver producto' });
  await expect(cardAction.getByText('Ver producto')).toHaveCSS('position', 'static');

  await page.getByRole('searchbox', { name: /Buscar en el cat.logo/ }).fill('Glomex');
  await expect(page).toHaveURL(/q=Glomex/);
  await expect.poll(() => requests.filter((path) => path.endsWith('/rpc/catalog_list_cards')).length).toBeGreaterThan(1);
  expect(requests.some((path) => path.endsWith('/productos'))).toBe(false);
});

test('keeps the main results visible until the shopper opens the filters', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo');

  const filters = page.getByRole('dialog', { name: 'Filtros' });
  const trigger = page.getByRole('button', { name: /^Filtros(?: \d+)?$/ });
  await expect(filters).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Categoría', exact: true }).selectOption('globos');
  await expect(page).toHaveURL(/catalogo\/globos$/);
  await trigger.click();

  const colorFamily = filters.getByRole('button', { name: /^Rojos/ });
  const exactColor = filters.getByRole('button', { name: /^Rojo\b/ });
  await expect(filters.getByText('Marca', { exact: true })).toBeHidden();
  await expect(colorFamily).toBeHidden();
  await expect(exactColor).toBeHidden();

  await filters.getByText('Color', { exact: true }).click();
  await colorFamily.click();
  await expect(page).toHaveURL(/familiaColor=rojos/);
  await expect(filters.getByText('Color (1)', { exact: true })).toBeVisible();
  await expect(exactColor).toBeHidden();

  await filters.getByText('Tonos exactos', { exact: true }).click();
  await exactColor.click();
  await expect(filters.getByText('Color (2)', { exact: true })).toBeVisible();
  await filters.getByText('Más filtros', { exact: true }).click();
  await expect(filters.getByText('Marca', { exact: true })).toBeVisible();
  await filters.getByRole('button', { name: 'Ver productos' }).click();

  await expect(filters).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/color=rojo/);
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
  await dialog.getByRole('button', { name: 'Ver mi pedido' }).click();
  await expect(dialog).toBeHidden();
  const cart = page.getByRole('dialog', { name: 'Mi pedido' });
  await expect(cart.getByText('Globo Latex Glomex')).toBeVisible();
  await expect(cart.getByRole('heading', { name: 'Revisa tus productos' })).toBeVisible();
  await expect(cart.getByLabel('Nombre completo')).toHaveCount(0);
  await cart.getByRole('button', { name: 'Continuar a mis datos' }).click();
  await expect(cart.getByRole('heading', { name: 'Tus datos y entrega' })).toBeFocused();
  await cart.getByLabel('Nombre completo').fill('Cliente Pruebas');
  await expect(cart.getByLabel('Sucursal para recoger')).toHaveValue('sol-naciente');
  await cart.getByRole('button', { name: 'Volver a mis productos' }).click();
  await expect(cart.getByText('Globo Latex Glomex')).toBeVisible();
  await cart.getByRole('button', { name: 'Continuar a mis datos' }).click();
  await expect(cart.getByLabel('Nombre completo')).toHaveValue('Cliente Pruebas');

  await cart.getByLabel('Teléfono de WhatsApp').fill('452 123 4567');
  await cart.getByLabel('Sucursal para recoger').selectOption('francisco-villa');
  const submitted = page.waitForRequest('**/rpc/catalog_create_order');
  await cart.getByRole('button', { name: 'Registrar pedido' }).click();
  expect((await submitted).postDataJSON()).toMatchObject({
    p_tipo_entrega: 'tienda',
    p_location_slug: 'francisco-villa',
    p_items: [{ variant_id: variantId, sale_presentation_id: presentationId, quantity: 1 }],
  });
  await expect(cart.getByRole('heading', { name: 'FP-PRUEBA-001' })).toBeVisible();
  const whatsapp = await cart.getByRole('link', { name: 'Abrir WhatsApp' }).getAttribute('href');
  expect(new URL(whatsapp).searchParams.get('text')).toContain('Suc. Francisco Villa');
  expect(page.context().pages()).toHaveLength(1);
  await expect(cart.getByRole('link', { name: 'Ver estado del pedido' })).toHaveAttribute('href', '/rastrear/FP-PRUEBA-001');

  await page.reload();
  await page.getByRole('button', { name: 'Mi pedido', exact: true }).click();
  await expect(cart.getByRole('link', { name: 'Ver mi último pedido' })).toHaveAttribute('href', '/rastrear/FP-PRUEBA-001');
});

test('groups product lines and keeps color, size and quantity choices on one product', async ({ page }) => {
  const smallSize = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: '9 pulgadas', numeric_value: 9, unit: 'pulgada' };
  const standard = detail.variants[0];
  const pastel = detail.variants[1];
  await mockCatalogV2(page, {
    listing: [
      { ...card, sizes: [smallSize, ...card.sizes], variant_count: 2, presentation_count: 2, presentation_types: ['bolsa', 'caja'] },
      {
        ...card,
        group_key: `${productId}:glomex-pastel`,
        line_id: pastelLineId,
        line_name: 'Pastel',
        line_slug: 'glomex-pastel',
        colors: [{ slug: 'azul-pastel', name: 'Azul pastel', hex: '#93c5fd' }],
      },
    ],
    productDetail: {
      ...detail,
      sizes: [smallSize, ...detail.sizes],
      variants: [
        {
          ...standard,
          presentations: [
            ...standard.presentations,
            { ...standard.presentations[0], id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', name: 'Caja con 500 piezas', presentation_type: 'caja', base_price: 380, tiers: [] },
          ],
        },
        {
          ...standard,
          id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          size_id: smallSize.id,
          size_name: smallSize.name,
          presentations: [{ ...standard.presentations[0], id: '12121212-1212-4121-8121-121212121212' }],
        },
        pastel,
      ],
    },
  });
  await page.goto('/catalogo');

  const tiles = page.locator('article');
  await expect(tiles).toHaveCount(1);
  await expect(tiles.first()).toContainText('2 colores · 2 medidas');
  await tiles.getByRole('button', { name: 'Elegir opciones' }).click();
  const dialog = page.getByRole('dialog', { name: 'Globo Latex Glomex' });
  await expect(dialog.getByRole('button', { name: 'Elige un color', exact: true })).toBeDisabled();

  await dialog.getByTestId('catalog-v2-global-color-trigger').click();
  const colorPicker = page.getByRole('dialog', { name: 'Explora por color' });
  await colorPicker.getByRole('button', { name: /^Rojo/ }).click();
  await colorPicker.getByRole('button', { name: 'Elegir Rojo' }).click();
  await dialog.getByRole('button', { name: '12 pulgadas', exact: true }).click();
  await dialog.getByRole('button', { name: /Bolsa con 100 piezas/ }).click();

  const quantity = dialog.getByRole('textbox', { name: 'Cantidad a pedir' });
  await quantity.fill('6');
  await quantity.press('Tab');
  await expect(dialog.getByRole('button', { name: /Agregar al pedido.*510/ })).toBeEnabled();

  await dialog.getByText('Precios por cantidad', { exact: true }).click();
  await dialog.getByRole('button', { name: 'Elegir 12', exact: true }).click();
  await expect(quantity).toHaveValue('12');
  await expect(dialog.getByRole('button', { name: /Agregar al pedido.*936/ })).toBeEnabled();

  await dialog.getByRole('button', { name: /Agregar al pedido.*936/ }).click();
  await dialog.getByRole('button', { name: '9 pulgadas', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Cantidad a pedir' }).fill('1');
  await dialog.getByRole('textbox', { name: 'Cantidad a pedir' }).press('Tab');
  await dialog.getByRole('button', { name: /Agregar al pedido.*85/ }).click();
  await dialog.getByRole('button', { name: 'Ver mi pedido' }).click();

  const cart = page.getByRole('dialog', { name: 'Mi pedido' });
  await expect(cart.getByRole('heading', { name: 'Globo Latex Glomex' })).toHaveCount(1);
  await expect(cart.getByText(/Rojo · 12 pulgadas/)).toBeVisible();
  await expect(cart.getByText(/Rojo · 9 pulgadas/)).toBeVisible();
  await expect(cart.getByRole('button', { name: /^Reducir .*9 pulgadas/ })).toBeDisabled();
});

test('lets customers choose visually by color across product lines', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo?producto=globo-latex-glomex');

  const dialog = page.getByRole('dialog', { name: 'Globo Latex Glomex' });
  await expect(dialog.getByRole('heading', { name: 'Elige las opciones de tu producto' })).toBeVisible();
  await dialog.getByTestId('catalog-v2-global-color-trigger').click();

  const colorPicker = page.getByRole('dialog', { name: 'Explora por color' });
  await colorPicker.getByRole('button', { name: /Azul pastel/ }).click();
  await colorPicker.getByRole('button', { name: 'Elegir Azul pastel' }).click();

  await expect(dialog.getByRole('button', {
    name: 'Color elegido Azul pastel Pastel Ver colores',
  })).toBeVisible();
  await expect(page).toHaveURL(/gama=glomex-pastel/);
  await expect(page).toHaveURL(/seleccionColor=azul-pastel/);
  await expect(page).toHaveURL(/seleccionMedida=12(\+|%20)pulgadas/);
  await expect(dialog.getByRole('button', { name: /Agregar al pedido/ })).toBeEnabled();
});

test('closes the color picker and product independently with Escape', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo?producto=globo-latex-glomex');

  const product = page.getByRole('dialog', { name: 'Globo Latex Glomex' });
  await expect(product.getByRole('button', { name: 'Regresar' })).toBeFocused();
  const trigger = product.getByTestId('catalog-v2-global-color-trigger');
  await trigger.click();
  const picker = page.getByRole('dialog', { name: 'Explora por color' });
  await expect(picker).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(product).toBeHidden();
  await expect(page).toHaveURL(/\/catalogo$/);
});

test('keeps the product-line path active while selecting a line', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo?producto=globo-latex-glomex');

  const dialog = page.getByRole('dialog', { name: 'Globo Latex Glomex' });
  const linePath = dialog.getByRole('button', {
    name: /Conozco la gama/,
  });
  await linePath.click();
  await dialog.getByRole('button', { name: 'Pastel', exact: true }).click();

  await expect(linePath).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/gama=glomex-pastel/);
});

test('restores the original catalog filters after closing product detail', async ({ page }) => {
  await mockCatalogV2(page);
  await page.goto('/catalogo');

  await page.locator('.catalog-v2-card__action').first().click();
  const dialog = page.getByRole('dialog', { name: 'Globo Latex Glomex' });
  await dialog.getByRole('button', { name: /Conozco la gama/ }).click();
  await dialog.getByRole('button', { name: 'Pastel', exact: true }).click();
  await expect(page).toHaveURL(/gama=glomex-pastel/);

  await dialog.getByRole('button', { name: 'Regresar' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('heading', { name: /Globo Latex Glomex/ })).toBeVisible();
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
