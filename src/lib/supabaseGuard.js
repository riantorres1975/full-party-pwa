import { supabase } from './supabase';

/**
 * Detecta errores de sesión expirada / JWT inválido en respuestas de Supabase.
 * Si la sesión expiró, cierra sesión y redirige al login.
 */
function isSessionError(error) {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  const msg = (error.message || '').toLowerCase();
  return (
    code === 'PGRST301' ||
    msg.includes('jwt expired') ||
    msg.includes('jwt') && msg.includes('invalid') ||
    msg.includes('not authenticated') ||
    msg.includes('no api key')
  );
}

/**
 * Envuelve una query de Supabase y maneja automáticamente errores de sesión.
 * @param {(client: typeof supabase) => Promise<{data, error}>} queryFn
 * @returns {Promise<{data, error}>}
 */
export async function guardedQuery(queryFn) {
  const result = await queryFn(supabase);

  if (result.error && isSessionError(result.error)) {
    await supabase.auth.signOut();
    window.location.hash = '#/admin';
    return { data: null, error: { ...result.error, message: 'Sesión expirada. Inicia sesión de nuevo.' } };
  }

  return result;
}

/**
 * Comprueba si un error de Supabase es de sesión expirada.
 * Si lo es, cierra sesión, redirige y lanza un Error para cortar el flujo.
 * Usar en funciones que no siguen el patrón `{ data, error }`.
 */
export async function throwIfSessionError(error) {
  if (error && isSessionError(error)) {
    await supabase.auth.signOut();
    window.location.hash = '#/admin';
    throw new Error('Sesión expirada. Inicia sesión de nuevo.');
  }
}
