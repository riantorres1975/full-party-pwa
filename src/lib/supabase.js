import { createClient } from '@supabase/supabase-js';

// Las variables VITE_ son expuestas al cliente por Vite automáticamente.
// Nunca pongas las claves directamente aquí — usa siempre el .env
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '[Supabase] Faltan variables de entorno.\n' +
    'Crea un archivo .env en la raíz con:\n' +
    '  VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJ...'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// bfcache: desconectar Realtime cuando la página se oculta, reconectar al volver.
// Los WebSockets abiertos bloquean el back/forward cache del navegador.
if (typeof window !== 'undefined' && supabase?.realtime) {
  window.addEventListener('pagehide', () => {
    try { supabase.realtime.disconnect(); } catch {}
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      try { supabase.realtime.connect(); } catch {}
    }
  });
}
