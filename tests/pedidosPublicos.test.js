import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buscarPedidoPublico,
  crearPedidoPublico,
  extraerFolioCreado,
  extraerPedidoCreado,
} from '../src/lib/pedidosPublicos.js';

test('extracts and validates the folio returned by the RPC', () => {
  assert.equal(extraerFolioCreado(' fp-a1b2c3d4e5 '), 'FP-A1B2C3D4E5');
  assert.equal(extraerFolioCreado({ folio: 'FP-00001' }), 'FP-00001');
  assert.equal(extraerFolioCreado([{ folio: 'FP-ABC123' }]), 'FP-ABC123');
  assert.equal(extraerFolioCreado(null), null);
  assert.equal(extraerFolioCreado('invalid'), null);
});

test('extracts folio, canonical total and replay flag from the new RPC shape', () => {
  assert.deepEqual(
    extraerPedidoCreado({ folio: 'fp-abc123', total: 80.5 }),
    { folio: 'FP-ABC123', total: 80.5, replay: false },
  );
  assert.deepEqual(
    extraerPedidoCreado({ folio: 'FP-ABC123', total: '97.25', replay: true }),
    { folio: 'FP-ABC123', total: 97.25, replay: true },
  );
  // Forma legacy (string): folio válido, total desconocido.
  assert.deepEqual(
    extraerPedidoCreado('FP-ABC123'),
    { folio: 'FP-ABC123', total: null, replay: false },
  );
  assert.deepEqual(
    extraerPedidoCreado(null),
    { folio: null, total: null, replay: false },
  );
  assert.deepEqual(
    extraerPedidoCreado({ folio: 'invalid', total: 10 }),
    { folio: null, total: null, replay: false },
  );
});

test('creates a public order through the secure RPC', async () => {
  const calls = [];
  const client = {
    async rpc(name, params) {
      calls.push({ name, params });
      return { data: { folio: 'FP-ABC1234567', total: 85 }, error: null };
    },
  };

  const pedido = await crearPedidoPublico(client, {
    nombre: 'Cliente Prueba',
    telefono: '4521234567',
    tipoEntrega: 'tienda',
    direccion: '',
    total: 85,
    detalles: [{ id: 'product-id', cantidad: 1 }],
  });

  assert.deepEqual(pedido, { folio: 'FP-ABC1234567', total: 85, replay: false });
  assert.deepEqual(calls, [{
    name: 'crear_pedido_publico',
    params: {
      p_cliente_nombre: 'Cliente Prueba',
      p_cliente_telefono: '4521234567',
      p_tipo_entrega: 'tienda',
      p_direccion: null,
      p_total: 85,
      p_detalles_json: [{ id: 'product-id', cantidad: 1 }],
    },
  }]);
});

test('sends the idempotency key only when provided', async () => {
  const calls = [];
  const client = {
    async rpc(name, params) {
      calls.push({ name, params });
      return { data: { folio: 'FP-IDEM1', total: 50, replay: true }, error: null };
    },
  };
  const payload = {
    nombre: 'Cliente Prueba',
    telefono: '4521234567',
    tipoEntrega: 'tienda',
    direccion: '',
    total: 50,
    detalles: [{ id: 'product-id', cantidad: 1 }],
  };

  const pedido = await crearPedidoPublico(client, {
    ...payload,
    idempotencyKey: '11111111-2222-3333-4444-555555555555',
  });

  assert.equal(calls[0].params.p_idempotency_key, '11111111-2222-3333-4444-555555555555');
  assert.deepEqual(pedido, { folio: 'FP-IDEM1', total: 50, replay: true });

  await crearPedidoPublico(client, payload);
  assert.equal(calls[1].params.p_idempotency_key, undefined);
});

test('rejects missing or malformed folios', async () => {
  const client = {
    async rpc() {
      return { data: null, error: null };
    },
  };

  await assert.rejects(
    () => crearPedidoPublico(client, {
      nombre: 'Cliente',
      telefono: '4521234567',
      tipoEntrega: 'tienda',
      direccion: '',
      total: 10,
      detalles: [{ id: 'product-id', cantidad: 1 }],
    }),
    /folio valido/,
  );
});

test('looks up an order by its exact normalized folio', async () => {
  const calls = [];
  const expected = [{ folio: 'FP-C60A9B1A67', estado: 'Por Surtir' }];
  const client = {
    async rpc(name, params) {
      calls.push({ name, params });
      return { data: expected, error: null };
    },
  };

  const pedidos = await buscarPedidoPublico(client, ' fp-c60a9b1a67 ');

  assert.deepEqual(pedidos, expected);
  assert.deepEqual(calls, [{
    name: 'buscar_pedido_por_folio',
    params: { p_folio: 'FP-C60A9B1A67' },
  }]);
});

test('rejects invalid tracking folios before calling Supabase', async () => {
  let called = false;
  const client = {
    async rpc() {
      called = true;
      return { data: [], error: null };
    },
  };

  await assert.rejects(() => buscarPedidoPublico(client, 'not-a-folio'), /formato valido/);
  assert.equal(called, false);
});
