import { useEffect, useState } from 'react';
import { fetchPublicConfigValue } from '../lib/supabasePublicRest';
import { deferSupabase } from '../utils/deferSupabase';

function normalizarValorPedidos(valor) {
  if (typeof valor === 'boolean') return valor;
  if (valor && typeof valor === 'object' && typeof valor.activo === 'boolean') return valor.activo;
  return true;
}

export function usePedidosHabilitados(enabled = true) {
  const [pedidosHabilitados, setPedidosHabilitados] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let cancelled = false;
    const abortController = new AbortController();

    fetchPublicConfigValue('pedidos_habilitados', { signal: abortController.signal })
      .then(({ data }) => {
        if (cancelled) return;
        setPedidosHabilitados(normalizarValorPedidos(data?.valor));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPedidosHabilitados(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let realtimeClient;
    let channel;
    const cancelDeferredLoad = deferSupabase((supabase) => {
      realtimeClient = supabase;
      channel = supabase
        .channel('pedidos-habilitados-rt')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'configuracion', filter: 'clave=eq.pedidos_habilitados' },
          ({ new: row }) => {
            setPedidosHabilitados(normalizarValorPedidos(row?.valor));
          }
        )
        .subscribe();
    });

    return () => {
      cancelDeferredLoad();
      if (realtimeClient && channel) realtimeClient.removeChannel(channel);
    };
  }, [enabled]);

  return { pedidosHabilitados, loading };
}
