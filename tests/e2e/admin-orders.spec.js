import { expect, test } from '@playwright/test';
import { loadEnv } from 'vite';

test('reviews variants and shortages, then confirms payment and records pickup in the same order', async ({ page, isMobile }) => {
  const env = loadEnv('production', process.cwd(), 'VITE_ADMIN_EMAILS');
  const email = env.VITE_ADMIN_EMAILS?.split(',').map((item) => item.trim()).find(Boolean) || 'admin@example.test';
  const userId = '33333333-3333-4333-8333-333333333333';
  const orderId = '44444444-4444-4444-8444-444444444444';
  const locations = [
    { id: '11111111-1111-4111-8111-111111111111', slug: 'francisco-villa', name: 'Francisco Villa', active: true },
    { id: '22222222-2222-4222-8222-222222222222', slug: 'sol-naciente', name: 'Sol Naciente', active: true },
  ];
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = Buffer.from(JSON.stringify({ exp: expiresAt, sub: userId, role: 'authenticated' })).toString('base64url');
  const items = [
    { nombre: 'Globo redondo', color: 'Negro', medida: '12 pulgadas', presentacion: 'Paquete de 25', sku: 'GL-NEG-12', cantidad: 2, precio: 30 },
    { nombre: 'Globo redondo', color: 'Rosa', medida: '12 pulgadas', presentacion: 'Pieza', sku: 'GL-ROS-12', cantidad: 1, precio: 10 },
  ].map((item, index) => ({
    ...item,
    schema: 2,
    inventory_location_id: locations[0].id,
    variant_id: `55555555-5555-4555-8555-55555555555${index}`,
    sale_presentation_id: `66666666-6666-4666-8666-66666666666${index}`,
  }));
  let order = {
    id: orderId, folio: 'FP-PRUEBA-01', cliente_nombre: 'Cliente de prueba', cliente_telefono: '6181234567',
    tipo_entrega: 'tienda', estado: 'Por Surtir', pago_estado: 'pendiente', total: 70,
    detalles_json: items, created_at: new Date().toISOString(),
  };
  const otherOrder = {
    ...order, id: '77777777-7777-4777-8777-777777777777', folio: 'FP-PRUEBA-02', estado: 'Listo para Entrega', tipo_entrega: 'envio',
    detalles_json: items.map(item => ({ ...item, inventory_location_id: locations[1].id })),
  };
  const legacyOrder = {
    ...order, id: '88888888-8888-4888-8888-888888888888', folio: 'FP-PRUEBA-03', estado: 'Listo para Entrega',
    detalles_json: [{ nombre: 'Globo redondo', cantidad: 1, precio: 10 }],
  };
  const completedOrder = {
    ...legacyOrder, id: '99999999-9999-4999-8999-999999999999', folio: 'FP-PRUEBA-04', estado: 'Enviado', pago_estado: 'confirmado',
  };
  let startAttempts = 0;
  let fulfillCalls = 0;
  let summaryUnavailable = true;

  await page.route('**/auth/v1/token?**', (route) => route.fulfill({
    json: {
      access_token: `eyJhbGciOiJIUzI1NiJ9.${token}.local-test-signature`, refresh_token: 'local-test-refresh-token',
      token_type: 'bearer', expires_at: expiresAt, expires_in: 3600,
      user: { id: userId, email, app_metadata: { provider: 'email' }, user_metadata: {} },
    },
  }));
  await page.route('**/rest/v1/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split('/').at(-1);
    const respond = (json, status = 200) => route.fulfill({ json, status });
    if (path === 'profiles') return respond({ id: userId, email, nombre: 'Equipo de pruebas', role: 'admin', activo: true });
    if (path === 'catalog_locations') return respond(locations);
    if (path === 'catalog_fulfill_order') {
      fulfillCalls += 1;
      expect(order.estado).toBe('Armando Pedido');
      expect(request.postDataJSON()).toEqual({
        p_order_id: orderId,
        p_items: items.map(({ variant_id, sale_presentation_id }, index) => ({ variant_id, sale_presentation_id, quantity: index === 0 ? 1 : 0 })),
      });
      const details = items.map((item, index) => ({
        ...item, precio_original: item.precio, precio: index === 0 ? 30 : 0, cantidad_surtida: index === 0 ? 1 : 0,
      }));
      order = { ...order, total: 30, detalles_json: details, estado: 'Listo para Entrega' };
      return respond({ folio: order.folio, total: order.total, details });
    }
    if (path !== 'pedidos') return respond([]);
    if (request.method() !== 'PATCH') {
      if (summaryUnavailable && url.searchParams.has('created_at')) return respond({ message: 'No se pudo leer el periodo.' }, 503);
      return respond([order, otherOrder, legacyOrder, completedOrder]);
    }

    const patch = request.postDataJSON();
    expect(url.searchParams.get('id')).toBe(`eq.${orderId}`);
    expect(url.searchParams.get('estado')).toBe(`eq.${order.estado}`);
    if (patch.estado === 'Armando Pedido') {
      startAttempts += 1;
      if (startAttempts === 1) return respond({ message: 'Se interrumpió el cambio de estado.' }, 409);
    }
    if (patch.pago_estado === 'confirmado') expect(patch.metodo_pago).toBe('efectivo');
    if (patch.estado === 'Enviado') expect(url.searchParams.get('pago_estado')).toBe('eq.confirmado');
    order = { ...order, ...patch };
    return respond({ id: order.id });
  });

  await page.goto('/admin/dashboard');
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill('local-test-password');
  await page.locator('button[type="submit"]').click();

  const priorities = page.getByRole('region', { name: 'Por atender' });
  const summary = page.getByRole('region', { name: 'Resumen del periodo' });
  const pendingLink = priorities.getByRole('link', { name: /Por Surtir 1/i });
  await expect(summary.getByRole('alert')).toContainText('No se pudo cargar el resumen del periodo.');
  await expect(pendingLink).toBeVisible();
  if (isMobile) {
    await expect(page.getByRole('navigation', { name: 'Secciones admin' }).getByRole('button', { name: 'Panel' })).toHaveAttribute('aria-current', 'page');
  } else {
    await expect(page.getByRole('navigation', { name: 'Navegación del administrador' }).getByRole('link', { name: 'Panel' })).toHaveAttribute('aria-current', 'page');
  }

  summaryUnavailable = false;
  await summary.getByRole('button', { name: 'Reintentar' }).click();
  await summary.getByRole('link', { name: completedOrder.folio, exact: true }).click();
  await expect(page).toHaveURL(/tab=historial&pedido=FP-PRUEBA-04/);
  const historyDialog = page.getByRole('dialog', { name: completedOrder.folio });
  await historyDialog.getByRole('button', { name: 'Cerrar pedido' }).click();
  await expect(historyDialog).toHaveCount(0);
  await page.goBack();
  await pendingLink.click();
  await expect(page).toHaveURL(/estado=por-surtir/);

  const filters = page.getByRole('group', { name: 'Filtrar pedidos por estado' });
  const branchFilter = page.getByRole('combobox', { name: 'Sucursal de surtido' });
  const otherCard = page.getByRole('button', { name: `Abrir pedido ${otherOrder.folio}` });
  const legacyCard = page.getByRole('button', { name: `Abrir pedido ${legacyOrder.folio}` });
  const pickupCard = page.getByRole('button', { name: `Abrir pedido ${order.folio}` });
  await expect(filters.getByRole('button', { name: /Por Surtir 1/i })).toHaveAttribute('aria-pressed', 'true');
  await expect(otherCard).toHaveCount(0);
  await filters.getByRole('button', { name: /Todos? 3/i }).click();
  await expect(otherCard).toContainText('Envío desde Suc. Sol Naciente');
  await branchFilter.selectOption('sin-sucursal');
  await expect(legacyCard).toBeVisible();
  await expect(pickupCard).toHaveCount(0);
  await branchFilter.selectOption(locations[0].id);
  await expect(pickupCard).toContainText('Recoge en Suc. Francisco Villa');
  await expect(otherCard).toHaveCount(0);
  await expect(legacyCard).toHaveCount(0);
  await filters.getByRole('button', { name: /Por Surtir 1/i }).click();
  await pickupCard.click();
  const dialog = page.getByRole('dialog', { name: order.folio });
  await expect(dialog.getByText('Recoge en Suc. Francisco Villa')).toBeVisible();
  const start = dialog.getByRole('button', { name: 'Empezar a surtir' });
  await start.click();
  await expect(page.getByText('Error al actualizar: Se interrumpió el cambio de estado.')).toBeVisible();
  await expect(start).toBeEnabled();
  await start.click();

  await expect(dialog.getByText('Negro · 12 pulgadas · Paquete de 25')).toBeVisible();
  await expect(dialog.getByText('SKU GL-NEG-12')).toBeVisible();
  const save = dialog.getByRole('button', { name: 'Guardar y pasar a listo' });
  if (isMobile) {
    await dialog.getByRole('spinbutton', { name: 'Cantidad surtida de Globo redondo' }).fill('1');
    await dialog.getByRole('button', { name: 'Confirmar parcial' }).click();
    await expect(dialog.getByText('SKU GL-ROS-12')).toBeVisible();
    await dialog.getByRole('button', { name: 'Ver todos los productos' }).click();
  } else {
    await dialog.getByRole('button', { name: 'Aumentar cantidad surtida de Globo redondo' }).click();
  }
  await expect(save).toBeDisabled();

  const refresh = page.waitForResponse((response) => response.request().method() === 'GET'
    && new URL(response.url()).pathname.endsWith('/rest/v1/pedidos'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await refresh;

  await dialog.getByRole('button', { name: 'No surtir', exact: true }).last().click();
  await expect(save).toBeEnabled();
  await save.click();

  const delivery = dialog.getByRole('button', { name: 'Registrar entrega' });
  await expect(delivery).toBeDisabled();
  await expect(dialog.getByText('$70.00', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Notificar al cliente' })).toBeEnabled();
  expect(fulfillCalls).toBe(1);
  expect(page.context().pages()).toHaveLength(1);
  await dialog.getByRole('button', { name: 'Efectivo' }).click();
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click();
  await expect(delivery).toBeEnabled();
  await delivery.click();
  await expect(dialog).toHaveCount(0);
  expect(order.estado).toBe('Enviado');
});
