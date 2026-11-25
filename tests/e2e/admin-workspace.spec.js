import { expect, test } from '@playwright/test';
import { loadEnv } from 'vite';

test.use({ actionTimeout: 8000 });

test('navigates the admin sections, updates a payment and discards store edits', async ({ page, isMobile }) => {
  test.slow();
  const env = loadEnv('production', process.cwd(), 'VITE_ADMIN_EMAILS');
  const email = env.VITE_ADMIN_EMAILS?.split(',').map(value => value.trim()).find(Boolean) || 'admin@example.test';
  const userId = '11111111-3333-4333-8333-333333333333';
  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + 3600;
  const token = Buffer.from(JSON.stringify({ exp: expiresAt, sub: userId, role: 'authenticated' })).toString('base64url');
  const profile = { id: userId, email, nombre: 'Equipo de pruebas', role: 'admin', activo: true, created_at: now.toISOString() };
  let order = {
    id: '22222222-4444-4444-8444-444444444444', folio: 'FP-ADMIN-01', cliente_nombre: 'Cliente de prueba', cliente_telefono: '4521234567',
    total: 60, tipo_entrega: 'tienda', estado: 'Listo para Entrega', pago_estado: 'confirmado', metodo_pago: 'efectivo', created_at: now.toISOString(),
    detalles_json: [{ product_id: 'product', nombre: 'Globos de fiesta', cantidad: 5, cantidad_surtida: 2, precio: 30 }],
  };
  const config = {
    tienda_info: { nombre: 'Full Party de prueba', whatsapp: '4521234567', horario: '', direccion: '', maps_url: '' },
    sucursales: [], redes_sociales: {},
  };
  const writes = [];
  const configWrites = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.route('**/auth/v1/token?**', route => route.fulfill({ json: {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${token}.local-test-signature`, refresh_token: 'local-test-refresh-token',
    token_type: 'bearer', expires_at: expiresAt, expires_in: 3600,
    user: { id: userId, email, app_metadata: { provider: 'email' }, user_metadata: {} },
  } }));
  await page.route('**/rest/v1/**', route => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/').at(-1);
    const respond = json => route.fulfill({ json });
    if (table === 'profiles') return respond(url.searchParams.has('id') ? profile : [profile]);
    if (table === 'profiles_pending') return respond([{
      email: 'invitacion@example.test', role: 'empleado', invited_at: now.toISOString(), expires_at: new Date(now.getTime() + 86400000).toISOString(),
    }]);
    if (table === 'configuracion') {
      if (req.method() === 'POST') {
        const entries = req.postDataJSON();
        configWrites.push(entries);
        for (const { clave, valor } of entries) config[clave] = valor;
        return respond([]);
      }
      return respond(Object.entries(config).map(([clave, valor]) => ({ clave, valor })));
    }
    if (table === 'pedidos' && req.method() === 'PATCH') {
      expect(url.searchParams.get('pago_estado')).toBe(`eq.${order.pago_estado}`);
      expect(url.searchParams.get('estado')).toBe('neq.Cancelado');
      writes.push(req.postDataJSON().pago_estado);
      order = { ...order, ...req.postDataJSON() };
      return respond(order);
    }
    if (table === 'pedidos') return respond([order]);
    return respond([]);
  });

  await page.goto('/admin/dashboard');
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill('local-test-password');
  await page.locator('button[type="submit"]').click();
  const main = page.locator('#admin-main');
  await expect(main.getByRole('heading', { name: 'Panel de Control', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Catálogo público' })).toHaveAttribute('href', '/catalogo');

  const go = async (label, heading, mobileDirect = false) => {
    if (isMobile) {
      const nav = page.getByRole('navigation', { name: 'Secciones admin' });
      if (mobileDirect) {
        await nav.getByRole('button', { name: label, exact: true }).click();
      } else {
        await nav.getByRole('button', { name: 'Más', exact: true }).click();
        await page.getByRole('dialog', { name: 'Más' }).getByRole('button', { name: label, exact: true }).click();
      }
    } else {
      await page.getByRole('navigation', { name: 'Navegación del administrador' }).getByRole('link', { name: label, exact: true }).click();
    }
    await expect(main.getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible();
  };

  await go('Pedidos', 'Gestión de pedidos', true);
  await go('Catálogo', 'Catálogo', true);
  await go('Inventario', 'Inventario');
  await go('Clientes', 'Clientes');
  await expect(main.getByRole(isMobile ? 'listitem' : 'row').getByText('Cliente de prueba', { exact: true })).toBeVisible();
  if (isMobile) {
    await expect(main.getByRole('combobox', { name: 'Ordenar' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Ver ficha del cliente' })).toBeVisible();
  }

  await go('Pagos', 'Pagos');
  const search = main.getByRole('searchbox', { name: 'Buscar por folio, nombre o teléfono' });
  await search.fill('4521234567');
  await main.getByRole('button', { name: 'Marcar pendiente', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Revertir pago confirmado' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Marcar pendiente' }).click();
  await expect(main.getByRole('button', { name: 'Confirmar pago', exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Confirmar pago', exact: true }).click();
  const payment = page.getByRole('dialog', { name: 'Confirmar pago' });
  await payment.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(payment).toHaveCount(0);
  expect(writes).toEqual(['pendiente', 'confirmado']);

  await go('Reportes', 'Reportes');
  await main.getByRole('group', { name: 'Secciones del reporte' }).getByRole('button', { name: 'Productos' }).click();
  await expect(page).toHaveURL(/vista=productos/);
  const sale = main.getByRole('row').filter({ hasText: 'Globos de fiesta' });
  await expect(sale.getByRole('cell', { name: '2', exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Año anterior' }).click();
  await expect(page).toHaveURL(new RegExp(`anio=${now.getFullYear() - 1}`));
  await expect(main.getByRole('group', { name: 'Secciones del reporte' }).getByRole('button', { name: 'Productos' })).toHaveAttribute('aria-pressed', 'true');

  await go('Usuarios y roles', 'Usuarios y roles');
  await expect(main.getByText('invitacion@example.test')).toBeVisible();
  await expect(main.getByRole('button', { name: /Cancelar invitaci[oó]n/i })).toBeVisible();
  await go('Tienda', 'Configuración de tienda');
  const storeName = main.locator('#tienda-nombre');
  await expect(storeName).toHaveValue('Full Party de prueba');
  await storeName.fill('Nombre sin guardar');
  await main.getByRole('button', { name: 'Descartar cambios', exact: true }).click();
  await page.getByRole('dialog', { name: 'Descartar cambios' }).getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(storeName).toHaveValue('Full Party de prueba');
  expect(configWrites).toHaveLength(0);
  await storeName.fill('Full Party actualizado');
  await main.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(main.getByRole('button', { name: 'Guardar cambios', exact: true })).toHaveCount(0);
  expect(configWrites).toHaveLength(1);
  expect(configWrites[0].map(({ clave }) => clave).sort()).toEqual(['redes_sociales', 'sucursales', 'tienda_info']);
  expect(config.tienda_info.nombre).toBe('Full Party actualizado');
  expect(errors).toEqual([]);
});
