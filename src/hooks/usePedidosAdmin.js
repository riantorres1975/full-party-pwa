import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { guardedQuery } from '../lib/supabaseGuard';
import { notificarCliente } from '../utils/whatsapp';

const ESTADOS = ['Por Surtir', 'Armando Pedido', 'Listo para Entrega'];
const ESTADOS_CON_CANCELADO = [...ESTADOS, 'Cancelado'];

export { ESTADOS, ESTADOS_CON_CANCELADO };

/**
 * Hook que centraliza toda la gestión de pedidos del admin:
 * fetch, realtime, filtrado, cambio de estado, cancelación y notificación.
 */
export function usePedidosAdmin({ toast, confirmCancelar }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [notificando, setNotificando] = useState(null);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await guardedQuery((client) =>
      client
        .from('pedidos')
        .select('id,folio,cliente_nombre,cliente_telefono,tipo_entrega,direccion,total,estado,detalles_json,notificado_estado,created_at,updated_at')
        .order('created_at', { ascending: false })
    );
    if (err) setError(err.message);
    else setPedidos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  // ── Realtime ───────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-admin-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' },
        ({ new: nuevo }) => setPedidos(prev => [nuevo, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        ({ new: actualizado }) => setPedidos(prev => prev.map(p => p.id === actualizado.id ? actualizado : p)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' },
        ({ old: eliminado }) => setPedidos(prev => prev.filter(p => p.id !== eliminado.id)))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Error en canal de pedidos — verifica que Replication esté activo en Supabase');
        }
      });
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Filtrado (memoizado) ──────────────────────────────────────
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
      const q = busqueda.toLowerCase();
      const coincideBusqueda = !busqueda ||
        p.folio.toLowerCase().includes(q) ||
        p.cliente_nombre.toLowerCase().includes(q) ||
        p.cliente_telefono.includes(q);
      return coincideEstado && coincideBusqueda;
    });
  }, [pedidos, filtroEstado, busqueda]);

  // ── Contadores (memoizado) ────────────────────────────────────
  const contadores = useMemo(() => {
    return ESTADOS_CON_CANCELADO.reduce((acc, e) => {
      acc[e] = pedidos.filter(p => p.estado === e).length;
      return acc;
    }, { todos: pedidos.length });
  }, [pedidos]);

  // ── Selección con auto-ajuste ─────────────────────────────────
  const pedidoSeleccionado = pedidosFiltrados.find(p => p.id === pedidoSeleccionadoId) ?? null;

  useEffect(() => {
    if (pedidosFiltrados.length === 0) { setPedidoSeleccionadoId(null); return; }
    if (!pedidoSeleccionadoId || !pedidosFiltrados.some(p => p.id === pedidoSeleccionadoId)) {
      setPedidoSeleccionadoId(pedidosFiltrados[0].id);
    }
  }, [pedidosFiltrados, pedidoSeleccionadoId]);

  // ── Cambiar estado ─────────────────────────────────────────────
  const cambiarEstado = useCallback(async (pedidoId, nuevoEstado) => {
    setActualizando(pedidoId);
    const { error: err } = await guardedQuery((client) =>
      client.from('pedidos').update({ estado: nuevoEstado, notificado_estado: null }).eq('id', pedidoId)
    );
    if (err) toast.error('Error al actualizar: ' + err.message);
    else setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado, notificado_estado: null } : p));
    setActualizando(null);
  }, [toast]);

  // ── Cancelar pedido ────────────────────────────────────────────
  const cancelarPedido = useCallback(async (pedido) => {
    const ok = await confirmCancelar({
      title: 'Cancelar pedido',
      message: `¿Seguro que deseas cancelar el pedido ${pedido.folio} de ${pedido.cliente_nombre}? Se abrirá WhatsApp para notificar al cliente.`,
      confirmLabel: 'Sí, cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    setActualizando(pedido.id);

    // Restaurar stock si ya descontó inventario
    if (pedido.estado === 'Listo para Entrega') {
      try {
        const articulos = (pedido.detalles_json || []).filter(a => a.encontrado !== false && a.id);
        await Promise.all(articulos.map(async (art) => {
          const { data: prodData, error: errFetch } = await supabase
            .from('productos').select('stock_actual, stock_ilimitado').eq('id', art.id).single();
          if (errFetch || !prodData || prodData.stock_ilimitado !== false) return;
          const nuevoStock = (Number(prodData.stock_actual) || 0) + Number(art.cantidad);
          await supabase.from('productos').update({ stock_actual: nuevoStock, activo: true }).eq('id', art.id);
        }));
      } catch (err) {
        console.warn('[Cancelar] Falla parcial al restaurar inventario', err);
      }
    }

    const { error: err } = await guardedQuery((client) =>
      client.from('pedidos').update({ estado: 'Cancelado', notificado_estado: null }).eq('id', pedido.id)
    );

    if (err) {
      toast.error('Error al cancelar: ' + err.message);
    } else {
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, estado: 'Cancelado', notificado_estado: null } : p));
      toast.success(`Pedido ${pedido.folio} cancelado`);
      notificarCliente({ ...pedido, estado: 'Cancelado' });
      await supabase.from('pedidos').update({ notificado_estado: 'Cancelado' }).eq('id', pedido.id);
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, notificado_estado: 'Cancelado' } : p));
    }
    setActualizando(null);
  }, [toast, confirmCancelar]);

  // ── Notificar ──────────────────────────────────────────────────
  const notificar = useCallback(async (pedido) => {
    setNotificando(pedido.id);
    notificarCliente(pedido);
    const { error: err } = await supabase
      .from('pedidos').update({ notificado_estado: pedido.estado }).eq('id', pedido.id);
    if (!err) {
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, notificado_estado: pedido.estado } : p));
    }
    setNotificando(null);
  }, []);

  return {
    pedidos, setPedidos, loading, error,
    actualizando, filtroEstado, setFiltroEstado,
    busqueda, setBusqueda, notificando,
    pedidoSeleccionadoId, setPedidoSeleccionadoId,
    fetchPedidos, pedidosFiltrados, contadores,
    pedidoSeleccionado,
    cambiarEstado, cancelarPedido, notificar,
  };
}
