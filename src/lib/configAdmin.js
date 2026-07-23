import { supabase } from './supabase';
import { guardedQuery, throwIfSessionError } from './supabaseGuard';

/**
 * Lee un valor de la tabla configuracion (lectura pública).
 * Devuelve el valor parseado o `defaultVal` si no existe.
 */
export async function getConfig(clave, defaultVal = null) {
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle();

  if (error) return defaultVal;
  return data ? data.valor : defaultVal;
}

/**
 * Escribe un valor en la tabla configuracion (requiere sesión admin).
 * Hace upsert por clave.
 */
export async function setConfig(clave, valor) {
  const { error } = await guardedQuery((client) =>
    client
      .from('configuracion')
      .upsert({ clave, valor }, { onConflict: 'clave' })
  );
  if (error) throwIfSessionError(error);
  if (error) throw new Error(`Error guardando config "${clave}": ${error.message}`);

  window.dispatchEvent(new CustomEvent('fp:config-updated', {
    detail: { clave, valor },
  }));
}
