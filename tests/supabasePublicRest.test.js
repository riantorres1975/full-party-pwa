import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublicRestClient } from '../src/lib/supabasePublicRest.js';

function createResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

test('builds an ordered and paginated PostgREST request', async () => {
  const requests = [];
  const client = createPublicRestClient({
    url: 'https://example.supabase.co/',
    key: 'public-key',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return createResponse([{ id: 1 }]);
    },
  });
  const controller = new AbortController();

  const result = await client
    .from('productos')
    .select('id,nombre')
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true, nullsFirst: false })
    .abortSignal(controller.signal)
    .range(48, 247);

  assert.deepEqual(result, { data: [{ id: 1 }], error: null });
  const requestUrl = new URL(requests[0].url);
  assert.equal(requestUrl.pathname, '/rest/v1/productos');
  assert.equal(requestUrl.searchParams.get('select'), 'id,nombre');
  assert.equal(requestUrl.searchParams.get('order'), 'activo.desc,nombre.asc.nullslast');
  assert.equal(requestUrl.searchParams.get('offset'), '48');
  assert.equal(requestUrl.searchParams.get('limit'), '200');
  assert.equal(requests[0].options.headers.apikey, 'public-key');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer public-key');
  assert.equal(requests[0].options.signal, controller.signal);
});

test('supports filtered maybeSingle queries', async () => {
  const requests = [];
  const client = createPublicRestClient({
    url: 'https://example.supabase.co',
    key: 'public-key',
    fetchImpl: async (url) => {
      requests.push(url);
      return createResponse([{ valor: { activo: true } }]);
    },
  });

  const result = await client
    .from('configuracion')
    .select('valor')
    .eq('clave', 'anuncio')
    .maybeSingle();

  assert.deepEqual(result, { data: { valor: { activo: true } }, error: null });
  const requestUrl = new URL(requests[0]);
  assert.equal(requestUrl.searchParams.get('clave'), 'eq.anuncio');
  assert.equal(requestUrl.searchParams.get('offset'), '0');
  assert.equal(requestUrl.searchParams.get('limit'), '1');
});

test('normalizes PostgREST and network errors', async () => {
  const serverClient = createPublicRestClient({
    url: 'https://example.supabase.co',
    key: 'public-key',
    fetchImpl: async () => createResponse(
      { code: 'PGRST301', message: 'Forbidden' },
      { ok: false, status: 403 },
    ),
  });
  const networkClient = createPublicRestClient({
    url: 'https://example.supabase.co',
    key: 'public-key',
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });

  const serverResult = await serverClient.from('productos').select('id').range(0, 1);
  const networkResult = await networkClient.from('productos').select('id').range(0, 1);

  assert.equal(serverResult.error.code, 'PGRST301');
  assert.equal(serverResult.error.message, 'Forbidden');
  assert.equal(networkResult.error.code, 'FETCH_ERROR');
  assert.equal(networkResult.error.message, 'offline');
});
