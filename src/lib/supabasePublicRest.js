function resolvePublicConfig() {
  const env = import.meta.env || {};
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('[Supabase REST] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
  }

  return { url, key };
}

function createRequestError(response, payload) {
  return {
    code: payload?.code || `HTTP_${response.status}`,
    message: payload?.message || `La consulta publica fallo con estado ${response.status}.`,
    details: payload?.details || null,
    hint: payload?.hint || null,
  };
}

export function createPublicRestClient({
  url,
  key,
  fetchImpl = globalThis.fetch,
}) {
  if (!url || !key) {
    throw new Error('[Supabase REST] Se requiere URL y anon key.');
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('[Supabase REST] Fetch no esta disponible.');
  }

  const restUrl = `${url.replace(/\/+$/, '')}/rest/v1`;

  return {
    from(table) {
      const queryState = {
        fields: '*',
        filters: [],
        orders: [],
        signal: undefined,
      };

      const execute = async ({ from = 0, to } = {}) => {
        const params = new URLSearchParams({ select: queryState.fields });

        queryState.filters.forEach(([field, value]) => {
          params.append(field, `eq.${String(value)}`);
        });

        if (queryState.orders.length > 0) {
          params.set('order', queryState.orders.join(','));
        }

        if (Number.isInteger(from) && Number.isInteger(to)) {
          params.set('offset', String(from));
          params.set('limit', String(Math.max(0, to - from + 1)));
        }

        try {
          const response = await fetchImpl(
            `${restUrl}/${encodeURIComponent(table)}?${params.toString()}`,
            {
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
              },
              signal: queryState.signal,
            },
          );
          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            return { data: null, error: createRequestError(response, payload) };
          }

          return { data: Array.isArray(payload) ? payload : [], error: null };
        } catch (error) {
          if (error?.name === 'AbortError') {
            return { data: null, error: { code: 'ABORT_ERR', message: 'Consulta cancelada.' } };
          }

          return {
            data: null,
            error: {
              code: 'FETCH_ERROR',
              message: error?.message || 'No se pudo completar la consulta publica.',
            },
          };
        }
      };

      const query = {
        select(fields) {
          queryState.fields = fields || '*';
          return query;
        },
        eq(field, value) {
          queryState.filters.push([field, value]);
          return query;
        },
        order(field, { ascending = true, nullsFirst } = {}) {
          let order = `${field}.${ascending ? 'asc' : 'desc'}`;
          if (nullsFirst === true) order += '.nullsfirst';
          if (nullsFirst === false) order += '.nullslast';
          queryState.orders.push(order);
          return query;
        },
        abortSignal(signal) {
          queryState.signal = signal;
          return query;
        },
        range(from, to) {
          return execute({ from, to });
        },
        async maybeSingle() {
          const result = await execute({ from: 0, to: 0 });
          if (result.error) return result;
          return { data: result.data[0] ?? null, error: null };
        },
      };

      return query;
    },
  };
}

let publicClient;

export function getPublicRestClient() {
  if (!publicClient) {
    publicClient = createPublicRestClient(resolvePublicConfig());
  }
  return publicClient;
}

export async function fetchPublicConfigValue(clave, { signal } = {}) {
  let query = getPublicRestClient()
    .from('configuracion')
    .select('valor')
    .eq('clave', clave);

  if (signal) query = query.abortSignal(signal);
  return query.maybeSingle();
}
