import { useState, useEffect, useCallback } from 'react';
import { guardedQuery } from '../../../../lib/supabaseGuard';
import { supabase } from '../../../../lib/supabase';

export function usePagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(null);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select('id,folio,cliente_nombre,cliente_telefono,total,estado,pago_estado,metodo_pago,pago_fecha,pago_notas,created_at')
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

  const confirmarPago = useCallback(async (pedidoId, { metodo_pago, notas } = {}) => {
    setActualizando(pedidoId);
    try {
      const { error: err } = await supabase
        .from('pedidos')
        .update({
          pago_estado: 'confirmado',
          metodo_pago: metodo_pago || null,
          pago_fecha: new Date().toISOString(),
          pago_notas: notas || null,
        })
        .eq('id', pedidoId);
      if (err) throw new Error(err.message);
      setPagos((prev) =>
        prev.map((p) =>
          p.id === pedidoId
            ? { ...p, pago_estado: 'confirmado', metodo_pago: metodo_pago || p.metodo_pago, pago_fecha: new Date().toISOString(), pago_notas: notas || p.pago_notas }
            : p
        )
      );
      return { ok: true };
    } catch (err) {
      console.error('[usePagos.confirmarPago]', err);
      return { ok: false, error: err.message };
    } finally {
      setActualizando(null);
    }
  }, []);

  const marcarPendiente = useCallback(async (pedidoId) => {
    setActualizando(pedidoId);
    try {
      const { error: err } = await supabase
        .from('pedidos')
        .update({ pago_estado: 'pendiente', pago_fecha: null })
        .eq('id', pedidoId);
      if (err) throw new Error(err.message);
      setPagos((prev) =>
        prev.map((p) =>
          p.id === pedidoId ? { ...p, pago_estado: 'pendiente', pago_fecha: null } : p
        )
      );
      return { ok: true };
    } catch (err) {
      console.error('[usePagos.marcarPendiente]', err);
      return { ok: false, error: err.message };
    } finally {
      setActualizando(null);
    }
  }, []);

  return { pagos, loading, error, actualizando, refetch: fetchPagos, confirmarPago, marcarPendiente };
}
