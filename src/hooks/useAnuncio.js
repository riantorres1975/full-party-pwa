import { useState, useEffect } from 'react';
import { fetchPublicConfigValue } from '../lib/supabasePublicRest';
import { deferSupabase } from '../utils/deferSupabase';

/**
 * useAnuncio — Fetches the public announcement from `configuracion` table
 * and stays in sync via Supabase Realtime.
 * Returns { mensaje, activo, loading }.
 * Only shown when `activo === true` and `mensaje` is non-empty.
 */
export function useAnuncio(enabled = true) {
  const [anuncio, setAnuncio] = useState({ mensaje: '', activo: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let cancelled = false;
    const abortController = new AbortController();

    fetchPublicConfigValue('anuncio', { signal: abortController.signal })
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.valor) {
          const v = data.valor;
          setAnuncio({ mensaje: v.mensaje || '', activo: !!v.activo });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [enabled]);

  // ── Realtime: actualizar anuncio cuando el admin lo modifique ──
  useEffect(() => {
    if (!enabled) return;

    let realtimeClient;
    let channel;
    const cancelDeferredLoad = deferSupabase((supabase) => {
      realtimeClient = supabase;
      channel = supabase
        .channel('anuncio-rt')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'configuracion', filter: 'clave=eq.anuncio' },
          ({ new: row }) => {
            if (row?.valor) {
              const v = row.valor;
              setAnuncio({ mensaje: v.mensaje || '', activo: !!v.activo });
            } else {
              setAnuncio({ mensaje: '', activo: false });
            }
          })
        .subscribe();
    });

    return () => {
      cancelDeferredLoad();
      if (realtimeClient && channel) realtimeClient.removeChannel(channel);
    };
  }, [enabled]);

  return { ...anuncio, loading };
}
