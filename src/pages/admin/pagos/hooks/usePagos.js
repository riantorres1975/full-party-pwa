import { useState, useEffect, useCallback, useRef } from 'react';
import { guardedQuery } from '../../../../lib/supabaseGuard';
import { supabase } from '../../../../lib/supabase';

const PAYMENT_FIELDS = 'id,folio,cliente_nombre,cliente_telefono,total,estado,pago_estado,metodo_pago,pago_fecha,pago_notas,created_at';

export function usePagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(null);
  const guardandoRef = useRef(false);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select(PAYMENT_FIELDS)
          .neq('estado', 'Cancelado')
          .order('created_at', { ascending: false })
      );
      if (err) throw new Error(err.message);
      setPagos(data || []);
    } catch (err) {
      console.error('[usePagos]', err);
      setError(err.message || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  const guardarPago = async (pedido, cambios) => {
    if (guardandoRef.current) return { ok: false };
    guardandoRef.current = true;
    setActualizando(pedido.id);
    try {
      let query = supabase
        .from('pedidos')
        .update(cambios)
        .eq('id', pedido.id)
        .neq('estado', 'Cancelado');
      query = pedido.pago_estado == null ? query.is('pago_estado', null) : query.eq('pago_estado', pedido.pago_estado);
      const { data, error: err } = await query.select(PAYMENT_FIELDS).maybeSingle();
      if (err) throw new Error(err.message);
      if (!data) {
        await fetchPagos();
        return { ok: false, stale: true };
      }
      setPagos(prev => prev.map(p => p.id === pedido.id ? data : p));
      return { ok: true, pedido: data };
    } catch (err) {
      console.error('[usePagos.guardarPago]', err);
      return { ok: false, error: err.message };
    } finally {
      guardandoRef.current = false;
      setActualizando(null);
    }
  };

  const confirmarPago = (pedido, { metodo_pago, notas } = {}) => guardarPago(pedido, {
    pago_estado: 'confirmado', metodo_pago: metodo_pago || null, pago_fecha: new Date().toISOString(), pago_notas: notas || null,
  });

  const marcarPendiente = pedido => guardarPago(pedido, { pago_estado: 'pendiente', pago_fecha: null });

  return { pagos, loading, error, actualizando, refetch: fetchPagos, confirmarPago, marcarPendiente };
}
