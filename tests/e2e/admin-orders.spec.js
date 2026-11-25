import { expect, test } from '@playwright/test';
import { loadEnv } from 'vite';

test('reviews variants and shortages, then confirms payment and records pickup in the same order', async ({ page, isMobile }) => {
  const env = loadEnv('production', process.cwd(), 'VITE_ADMIN_EMAILS');
  const email = env.VITE_ADMIN_EMAILS?.split(',').map((item) => item.trim()).find(Boolean) || 'admin@example.test';
  const userId = '33333333-3333-4333-8333-333333333333';
  const orderId = '44444444-4444-4444-8444-444444444444';
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = Buffer.from(JSON.stringify({ exp: expiresAt, sub: userId, role: 'authenticated' })).toString('base64url');
  const items = [
    { nombre: 'Globo redondo', color: 'Negro', medida: '12 pulgadas', presentacion: 'Paquete de 25', sku: 'GL-NEG-12', cantidad: 2, precio: 30 },
    { nombre: 'Globo redondo', color: 'Rosa', medida: '12 pulgadas', presentacion: 'Pieza', sku: 'GL-ROS-12', cantidad: 1, precio: 10 },
  ].map((item, index) => ({
    ...item,
    schema: 2,
    variant_id: `55555555-5555-4555-8555-55555555555${index}`,
    sale_presentation_id: `66666666-6666-4666-8666-66666666666${index}`,
  }));
  let order = {
    id: orderId, folio: 'FP-PRUEBA-01', cliente_nombre: 'Cliente de prueba', cliente_telefono: '6181234567',
    tipo_entrega: 'tienda', estado: 'Por Surtir', pago_estado: 'pendiente', total: 70,
    detalles_json: items, created_at: new Date().toISOString(),
  };
  const otherOrder = { ...order, id: '77777777-7777-4777-8777-777777777777', folio: 'FP-PRUEBA-02', estado: 'Listo para Entrega' };
  let startAttempts = 0;
  let fulfillCalls = 0;

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
    if (request.method() !== 'PATCH') return respond([order, otherOrder]);

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

  await page.goto('/admin/pedidos');
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill('local-test-password');
  await page.locator('button[type="submit"]').click();

  const filters = page.getByRole('group', { name: 'Filtrar pedidos por estado' });
  await expect(page.getByRole('button', { name: `Abrir pedido ${otherOrder.folio}` })).toBeVisible();
  await filters.getByRole('button', { name: /Por Surtir 1/i }).click();
  await expect(page.getByRole('button', { name: `Abrir pedido ${otherOrder.folio}` })).toHaveCount(0);
  await page.getByRole('button', { name: `Abrir pedido ${order.folio}` }).click();
  const dialog = page.getByRole('dialog', { name: order.folio });
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
