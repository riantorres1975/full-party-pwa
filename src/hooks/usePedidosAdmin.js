import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { guardedQuery } from '../lib/supabaseGuard';
import { notificarCliente } from '../utils/whatsapp';
import { fuzzySearch } from '../utils/fuzzySearch';

const ESTADOS = ['Por Surtir', 'Armando Pedido', 'Listo para Entrega', 'Enviado'];
const ESTADOS_CON_CANCELADO = [...ESTADOS, 'Cancelado'];
const PEDIDOS_SELECT_BASE = 'id,folio,cliente_nombre,cliente_telefono,tipo_entrega,direccion,total,estado,pago_estado,metodo_pago,detalles_json,notificado_estado,created_at,updated_at';
const PEDIDOS_SELECT_CON_FECHAS_HISTORIAL = `${PEDIDOS_SELECT_BASE},fecha_envio,fecha_cancelado`;
const PEDIDO_SEARCH_KEYS = [
  { name: 'folio', weight: 0.35 },
  { name: 'cliente_nombre', weight: 0.3 },
  { name: 'cliente_telefono', weight: 0.2 },
  { name: 'estado', weight: 0.1 },
  { name: 'metodo_pago', weight: 0.05 },
];

function esErrorColumnasFechaHistorial(error) {
  if (!error) return false;
  const detalle = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  return detalle.includes('fecha_envio') || detalle.includes('fecha_cancelado');
}

async function actualizarPedidoConFallbackHistorial(pedidoId, payloadConFechas, payloadBase) {
  let respuesta = await guardedQuery((client) =>
    client.from('pedidos').update(payloadConFechas).eq('id', pedidoId)
  );

  if (respuesta.error && esErrorColumnasFechaHistorial(respuesta.error)) {
    respuesta = await guardedQuery((client) =>
      client.from('pedidos').update(payloadBase).eq('id', pedidoId)
    );
  }

  return respuesta;
}

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
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (!window.isSecureContext) return 'insecure';
    return Notification.permission;
  });

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }
    if (!window.isSecureContext) {
      setNotificationPermission('insecure');
      return 'insecure';
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const showNewOrderNotification = useCallback(async (order, isTest = false) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!window.isSecureContext) return;
    if (Notification.permission !== 'granted') return;

    const title = isTest ? 'Notificacion de prueba' : 'Nuevo pedido recibido';
    const body = isTest
      ? 'Las notificaciones del panel admin estan funcionando.'
      : `${order.folio || 'Sin folio'} · ${order.cliente_nombre || 'Cliente'} · $${Number(order.total || 0).toFixed(2)}`;

    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: `order-${order.id}`,
          data: { url: '/admin' },
          vibrate: [200, 120, 200],
        });
        return;
      }
      // Fallback when service worker is unavailable
      new Notification(title, { body, icon: '/icons/icon-192.png', tag: `order-${order.id}` });
    } catch (err) {
      console.warn('[Notifications] Could not display notification', err);
    }
  }, []);

  const testNotification = useCallback(async () => {
    await showNewOrderNotification({ id: 'test', folio: 'FP-TEST', cliente_nombre: 'Admin', total: 0 }, true);
  }, [showNewOrderNotification]);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchPedidos = useCallback(async () => {
    // Only show loading skeleton on initial load (no data yet).
    // Background refreshes (e.g. returning from another tab) keep showing existing data.
    setPedidos(prev => { if (prev.length === 0) setLoading(true); return prev; });
    setError('');

    let respuesta = await guardedQuery((client) =>
      client
        .from('pedidos')
        .select(PEDIDOS_SELECT_CON_FECHAS_HISTORIAL)
        .order('created_at', { ascending: false })
    );

    if (respuesta.error && esErrorColumnasFechaHistorial(respuesta.error)) {
      respuesta = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select(PEDIDOS_SELECT_BASE)
          .order('created_at', { ascending: false })
      );
    }

    const { data, error: err } = respuesta;

    if (err) setError(err.message);
    else setPedidos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  // ── Realtime ───────────────────────────────────────────────────
  useEffect(() => {
    let channel;

    const suscribir = () => {
      channel = supabase
        .channel('pedidos-admin-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' },
          ({ new: nuevo }) => {
            setPedidos(prev => (prev.some(p => p.id === nuevo.id) ? prev : [nuevo, ...prev]));
            showNewOrderNotification(nuevo);
          })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' },
          ({ new: actualizado }) => setPedidos(prev => prev.map(p => p.id === actualizado.id ? actualizado : p)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' },
          ({ old: eliminado }) => setPedidos(prev => prev.filter(p => p.id !== eliminado.id)))
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[Realtime] Error en canal de pedidos — verifica que Replication esté activo en Supabase');
          }
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reconectar canal y refrescar datos al volver desde segundo plano
        if (channel) supabase.removeChannel(channel);
        suscribir();
        fetchPedidos();
      }
    };

    suscribir();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) supabase.removeChannel(channel);
    };
  }, [showNewOrderNotification, fetchPedidos]);

  // ── Filtrado (memoizado) ──────────────────────────────────────
  const pedidosFiltrados = useMemo(() => {
    const porEstado = filtroEstado === 'todos'
      ? pedidos
      : pedidos.filter(p => p.estado === filtroEstado);

    return fuzzySearch(porEstado, busqueda, PEDIDO_SEARCH_KEYS, { threshold: 0.38 });
  }, [pedidos, filtroEstado, busqueda]);

  // Solo búsqueda, sin filtro de estado — para el tablero Kanban
  const pedidosPorBusqueda = useMemo(() => {
    return fuzzySearch(pedidos, busqueda, PEDIDO_SEARCH_KEYS, { threshold: 0.38 });
  }, [pedidos, busqueda]);

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

  // ── Confirmar pago de un pedido ────────────────────────────────
  const confirmarPagoPedido = useCallback(async (pedidoId, { metodo_pago } = {}) => {
    const { error: err } = await supabase
      .from('pedidos')
      .update({ pago_estado: 'confirmado', metodo_pago: metodo_pago || null, pago_fecha: new Date().toISOString() })
      .eq('id', pedidoId);
    if (err) {
      toast.error('Error al confirmar pago: ' + err.message);
      return false;
    }
    setPedidos(prev => prev.map(p =>
      p.id === pedidoId ? { ...p, pago_estado: 'confirmado', metodo_pago: metodo_pago || p.metodo_pago } : p
    ));
    toast.success('Pago confirmado');
    return true;
  }, [toast]);

  // ── Cambiar estado (solo avance secuencial) ────────────────────
  const cambiarEstado = useCallback(async (pedidoId, nuevoEstado) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      const idxActual = ESTADOS.indexOf(pedido.estado);
      const idxNuevo  = ESTADOS.indexOf(nuevoEstado);
      if (idxNuevo !== idxActual + 1) {
        toast.error('Solo puedes avanzar al siguiente estado');
        return;
      }
      if (nuevoEstado === 'Enviado' && pedido.pago_estado !== 'confirmado') {
        toast.error('Confirma el pago antes de marcar como Enviado');
        return;
      }
    }
    setActualizando(pedidoId);
    const fechaEnvio = nuevoEstado === 'Enviado' ? new Date().toISOString() : null;
    const payloadBase = { estado: nuevoEstado, notificado_estado: null };
    const payloadConFechas = fechaEnvio
      ? { ...payloadBase, fecha_envio: fechaEnvio }
      : payloadBase;

    const { error: err } = await actualizarPedidoConFallbackHistorial(
      pedidoId,
      payloadConFechas,
      payloadBase
    );

    if (err) toast.error('Error al actualizar: ' + err.message);
    else {
      setPedidos(prev => prev.map(p => {
        if (p.id !== pedidoId) return p;
        return {
          ...p,
          estado: nuevoEstado,
          notificado_estado: null,
          ...(fechaEnvio ? { fecha_envio: fechaEnvio } : {}),
        };
      }));
    }
    setActualizando(null);
  }, [toast, pedidos]);

  // Cancel order
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

    const fechaCancelado = new Date().toISOString();
    const payloadBase = { estado: 'Cancelado', notificado_estado: null };
    const payloadConFechas = { ...payloadBase, fecha_cancelado: fechaCancelado };

    const { error: err } = await actualizarPedidoConFallbackHistorial(
      pedido.id,
      payloadConFechas,
      payloadBase
    );

    if (err) {
      toast.error('Error al cancelar: ' + err.message);
    } else {
      setPedidos(prev => prev.map(p => p.id === pedido.id
        ? { ...p, estado: 'Cancelado', notificado_estado: null, fecha_cancelado: fechaCancelado }
        : p));
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
    pedidoSeleccionado, pedidosPorBusqueda,
    cambiarEstado, cancelarPedido, notificar, confirmarPagoPedido,
    notificationPermission, requestNotificationPermission, testNotification,
  };
}
