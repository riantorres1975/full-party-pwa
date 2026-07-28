import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarPedidoPublico } from '../src/lib/pedidosPublicos.js';

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

test('propagates tracking RPC errors', async () => {
  const expected = new Error('network failed');
  const client = {
    async rpc() {
      return { data: null, error: expected };
    },
  };

  await assert.rejects(
    () => buscarPedidoPublico(client, 'FP-ABC123'),
    expected,
  );
});
