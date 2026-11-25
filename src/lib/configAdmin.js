import { guardedQuery } from './supabaseGuard';

/**
 * Lee la configuración del panel. Las claves ausentes se completan en el formulario.
 */
export async function getConfigEntries(keys) {
  const { data, error } = await guardedQuery(client => client.from('configuracion').select('clave,valor').in('clave', keys));
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map(({ clave, valor }) => [clave, valor]));
}

/**
 * Escribe la configuración en una sola operación (requiere sesión admin).
 */
export async function setConfigEntries(config) {
  const entries = Object.entries(config).map(([clave, valor]) => ({ clave, valor }));
  const { error } = await guardedQuery((client) =>
    client
      .from('configuracion')
      .upsert(entries, { onConflict: 'clave' })
  );
  if (error) throw new Error(error.message);

  for (const entry of entries) {
    window.dispatchEvent(new CustomEvent('fp:config-updated', { detail: entry }));
  }
}
