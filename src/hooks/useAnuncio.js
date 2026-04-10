import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useAnuncio — Fetches the public announcement from `configuracion` table
 * and stays in sync via Supabase Realtime.
 * Returns { mensaje, activo, loading }.
 * Only shown when `activo === true` and `mensaje` is non-empty.
 */
export function useAnuncio() {
  const [anuncio, setAnuncio] = useState({ mensaje: '', activo: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'anuncio')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.valor) {
          const v = data.valor;
          setAnuncio({ mensaje: v.mensaje || '', activo: !!v.activo });
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // ── Realtime: actualizar anuncio cuando el admin lo modifique ──
  useEffect(() => {
    const channel = supabase
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

    return () => supabase.removeChannel(channel);
  }, []);

  return { ...anuncio, loading };
}
