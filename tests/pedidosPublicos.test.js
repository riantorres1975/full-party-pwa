import test from 'node:test';
import assert from 'node:assert/strict';
import {
  crearPedidoPublico,
  extraerFolioCreado,
} from '../src/lib/pedidosPublicos.js';

test('extracts and validates the folio returned by the RPC', () => {
  assert.equal(extraerFolioCreado(' fp-a1b2c3d4e5 '), 'FP-A1B2C3D4E5');
  assert.equal(extraerFolioCreado({ folio: 'FP-00001' }), 'FP-00001');
  assert.equal(extraerFolioCreado([{ folio: 'FP-ABC123' }]), 'FP-ABC123');
  assert.equal(extraerFolioCreado(null), null);
  assert.equal(extraerFolioCreado('invalid'), null);
});

test('creates a public order through the secure RPC', async () => {
  const calls = [];
  const client = {
    async rpc(name, params) {
      calls.push({ name, params });
      return { data: 'FP-ABC1234567', error: null };
    },
  };

  const folio = await crearPedidoPublico(client, {
    nombre: 'Cliente Prueba',
    telefono: '4521234567',
    tipoEntrega: 'tienda',
    direccion: '',
    total: 85,
    detalles: [{ id: 'product-id', cantidad: 1 }],
  });

  assert.equal(folio, 'FP-ABC1234567');
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
