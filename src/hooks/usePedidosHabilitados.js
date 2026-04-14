import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function normalizarValorPedidos(valor) {
  if (typeof valor === 'boolean') return valor;
  if (valor && typeof valor === 'object' && typeof valor.activo === 'boolean') return valor.activo;
  return true;
}

export function usePedidosHabilitados() {
  const [pedidosHabilitados, setPedidosHabilitados] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'pedidos_habilitados')
      .maybeSingle()
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
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('pedidos-habilitados-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracion', filter: 'clave=eq.pedidos_habilitados' },
        ({ new: row }) => {
          setPedidosHabilitados(normalizarValorPedidos(row?.valor));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pedidosHabilitados, loading };
}
