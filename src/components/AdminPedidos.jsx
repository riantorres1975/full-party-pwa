import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, ChevronDown, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SIMBOLO_MONEDA } from '../data/productos';

const ESTADOS = ['Por Surtir', 'Armando Pedido', 'Listo para Entrega'];

const ESTADO_META = {
  'Por Surtir':         { color: '#ef4444', bg: '#fee2e2', emoji: '🛍️' },
  'Armando Pedido':     { color: '#eab308', bg: '#fef9c3', emoji: '🎀' },
  'Listo para Entrega': { color: '#22c55e', bg: '#dcfce7', emoji: '🎉' },
};

// ── Notificación WhatsApp al cliente ────────────────────────────────────────
function notificarCliente(pedido) {
  const { cliente_nombre: nombre, cliente_telefono: tel, folio, estado } = pedido;

  let mensaje = '';
  switch (estado) {
    case 'Por Surtir':
      mensaje = `¡Hola ${nombre}! 🎉 Recibimos tu pedido *${folio}* y ya está en nuestro sistema. En breve comenzamos a prepararlo. ¡Gracias por tu compra! 🛍️`;
      break;
    case 'Armando Pedido':
      mensaje = `¡Hola ${nombre}! 🎀 Te confirmamos que ya estamos preparando tu pedido *${folio}*. En cuanto esté listo te avisamos. ¡Pronto la fiesta! 🎈`;
      break;
    case 'Listo para Entrega':
      mensaje = `¡Buenas noticias ${nombre}! 🎉 Tu pedido *${folio}* ya está listo. Puedes pasar a recogerlo o en breve saldrá a domicilio. ¡A celebrar! 🥳`;
      break;
    default:
      mensaje = `Hola ${nombre}, hay una actualización en tu pedido *${folio}*. Estado actual: ${estado}.`;
  }

  const telefonoLimpio = tel.replace(/[\s\-\(\)]/g, '');
  const url = `https://wa.me/52${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ── Lista de artículos expandible (acordeón) ────────────────────────────────
function ItemArticulo({ item }) {
  const [imgError, setImgError] = useState(false);
  const subtotal = (item.precio * item.cantidad).toFixed(2);

  return (
    <div className="flex gap-3 py-3 border-b border-ink-100 last:border-0">
      {/* Miniatura */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-ink-50
                      border-2 border-ink-100 flex items-center justify-center">
        {item.imagen_url && !imgError ? (
          <img
            src={item.imagen_url}
            alt={item.nombre}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <Package size={24} className="text-ink-300" />
        )}
      </div>

      {/* Detalles */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-body font-black text-ink-800 leading-snug line-clamp-2">
          {item.nombre}
        </p>
        {item.tamano && (
          <p className="text-[11px] font-body text-ink-400 mt-0.5">
            Tamaño: {item.tamano}
          </p>
        )}
        {item.familia_mayoreo && (
          <p className="text-[11px] font-body text-ink-400">
            Mayoreo: {item.familia_mayoreo}
          </p>
        )}
        <p className="text-[11px] font-body text-ink-400">
          Cantidad: {item.cantidad}
        </p>
      </div>

      {/* Precio */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-body font-black text-ink-800">
          {SIMBOLO_MONEDA}{subtotal}
        </p>
        <p className="text-[10px] font-body text-ink-400">
          {SIMBOLO_MONEDA}{item.precio.toFixed(2)} c/u
        </p>
      </div>
    </div>
  );
}

function ListaArticulos({ items, meta }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="mb-3 rounded-xl overflow-hidden"
         style={{ border: `2px solid ${meta.bg}` }}>

      {/* Encabezado del acordeón */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5
                   transition-colors duration-150"
        style={{ background: meta.bg }}
      >
        <span className="text-xs font-body font-black" style={{ color: meta.color }}>
          🛒 Lista de Artículos
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: meta.color, color: 'white' }}>
            {items.length}
          </span>
        </span>
        <ChevronDown
          size={16}
          style={{
            color: meta.color,
            transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        />
      </button>

      {/* Contenido expandible */}
      {abierto && (
        <div className="px-3 bg-white animate-fade-in">
          {items.map((item, i) => (
            <ItemArticulo key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de un pedido ─────────────────────────────────────────────────────
function TarjetaPedido({ pedido, onCambiarEstado, actualizando, notificado, onNotificar }) {
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha    = new Date(pedido.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const esActualizando = actualizando === pedido.id;
  // Notificado = ya se envió WA para el estado ACTUAL de este pedido
  const yaNotificado = notificado === pedido.estado;

  return (
    <div
      className="bg-white rounded-2xl p-4 transition-all duration-300"
      style={{
        border: `2px solid ${meta.bg}`,
        boxShadow: `0 2px 12px ${meta.color}15`,
        opacity: esActualizando ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="font-display text-base text-ink-900">{pedido.folio}</span>
          <p className="text-[11px] font-body text-ink-400 mt-0.5">{fecha}</p>
        </div>
        <span
          className="text-[11px] font-body font-black px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.emoji} {pedido.estado}
        </span>
      </div>

      {/* Info cliente */}
      <div className="space-y-1 mb-3 pb-3 border-b border-ink-100">
        <p className="text-sm font-body font-bold text-ink-800">{pedido.cliente_nombre}</p>
        <p className="text-xs font-body text-ink-400">📞 {pedido.cliente_telefono}</p>
        <p className="text-xs font-body text-ink-400">
          {pedido.tipo_entrega === 'envio' ? '🚚 Envío a domicilio' : '🏪 Recoger en tienda'}
        </p>
        {pedido.direccion && (
          <p className="text-xs font-body text-ink-400 leading-relaxed">📍 {pedido.direccion}</p>
        )}
      </div>

      {/* ── Acordeón de artículos ── */}
      {pedido.detalles_json?.length > 0 && (
        <ListaArticulos items={pedido.detalles_json} meta={meta} />
      )}

      {/* Total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-body text-ink-400 font-bold">Total</span>
        <span className="font-body font-black text-base" style={{ color: meta.color }}>
          {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(2)}
        </span>
      </div>

      {/* Selector de estado */}
      <div className="relative">
        {esActualizando && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.8)' }}>
            <div className="w-4 h-4 rounded-full border-2 border-ink-200 border-t-ink-600 animate-spin" />
          </div>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {ESTADOS.map(estado => {
            const m       = ESTADO_META[estado];
            const activo  = pedido.estado === estado;
            return (
              <button
                key={estado}
                onClick={() => !activo && onCambiarEstado(pedido.id, estado)}
                disabled={activo || esActualizando}
                className="py-1.5 px-2 rounded-xl text-[11px] font-body font-black
                           transition-all duration-200 active:scale-95
                           disabled:cursor-default"
                style={activo
                  ? { background: m.color, color: 'white', boxShadow: `0 2px 8px ${m.color}55` }
                  : { background: m.bg, color: m.color }
                }
              >
                {m.emoji} {estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botón notificar por WhatsApp */}
      <button
        onClick={() => { notificarCliente(pedido); onNotificar(pedido.id, pedido.estado); }}
        disabled={yaNotificado}
        className="mt-3 w-full flex items-center justify-center gap-2
                   py-2.5 rounded-xl text-sm font-body font-black text-white
                   transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
        style={yaNotificado
          ? { background: '#d1fae5', color: '#6ee7b7', boxShadow: 'none' }
          : { background: 'linear-gradient(135deg, #25D366, #1db954)',
              boxShadow: '0 3px 12px #25D36633' }
        }
      >
        <MessageCircle size={16} />
        {yaNotificado ? '✓ Cliente notificado' : 'Notificar al cliente'}
      </button>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function AdminPedidos({ user, onSignOut }) {
  const [pedidos,      setPedidos]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [actualizando, setActualizando] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda,     setBusqueda]     = useState('');
  // { [pedidoId]: estadoEnQueSeNotificó } — se borra al cambiar estado
  const [notificados,  setNotificados]  = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_notificados') ?? '{}');
    } catch { return {}; }
  });

  const setNotificadosPersistente = (updater) => {
    setNotificados(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('admin_notificados', JSON.stringify(next));
      return next;
    });
  };

  // ── Fetch pedidos ──────────────────────────────────────────────────────────
  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    else setPedidos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  // ── Realtime — escucha INSERT, UPDATE y DELETE en tiempo real ───────────────
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-admin-rt')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        ({ new: nuevo }) => {
          setPedidos(prev => [nuevo, ...prev]); // aparece arriba inmediatamente
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        ({ new: actualizado }) => {
          setPedidos(prev => prev.map(p => p.id === actualizado.id ? actualizado : p));
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pedidos' },
        ({ old: eliminado }) => {
          setPedidos(prev => prev.filter(p => p.id !== eliminado.id));
        }
      )
      .subscribe((status) => {
        // 'SUBSCRIBED' confirma que el canal está activo
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Error en canal de pedidos — verifica que Replication esté activo en Supabase');
        }
      });

    return () => supabase.removeChannel(channel);
  }, []); // sin dependencias — se monta una sola vez

  // ── Cambiar estado ─────────────────────────────────────────────────────────
  async function cambiarEstado(pedidoId, nuevoEstado) {
    setActualizando(pedidoId);
    const { error: err } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (err) {
      alert('Error al actualizar: ' + err.message);
    } else {
      // Actualización optimista
      setPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      ));
      // Al cambiar estado se reactiva el botón de notificar
      setNotificadosPersistente(prev => {
        const copia = { ...prev };
        delete copia[pedidoId];
        return copia;
      });
    }
    setActualizando(null);
  }

  // ── Filtrado local ─────────────────────────────────────────────────────────
  const pedidosFiltrados = pedidos.filter(p => {
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const coincideBusqueda = !busqueda ||
      p.folio.toLowerCase().includes(q) ||
      p.cliente_nombre.toLowerCase().includes(q) ||
      p.cliente_telefono.includes(q);
    return coincideEstado && coincideBusqueda;
  });

  // ── Contadores por estado ──────────────────────────────────────────────────
  const contadores = ESTADOS.reduce((acc, e) => {
    acc[e] = pedidos.filter(p => p.estado === e).length;
    return acc;
  }, { todos: pedidos.length });

  return (
    <div className="min-h-screen" style={{ background: '#f8f4ff' }}>

      {/* ── Header admin ── */}
      <header className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #1a0733, #3d1a6e)',
                       boxShadow: '0 2px 20px #1a073340' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎪</span>
          <div>
            <h1 className="font-display text-lg text-white leading-none">Panel Admin</h1>
            <p className="text-[11px] font-body text-purple-300">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPedidos}
            className="p-2 rounded-full text-purple-300 hover:text-white transition-colors"
            title="Actualizar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                   0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-full text-xs font-body font-black
                       text-purple-300 hover:text-white transition-colors border border-purple-700
                       hover:border-purple-400"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">

        {/* ── Tarjetas resumen ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ key: 'todos', label: 'Total', emoji: '📋', color: '#6b35b8', bg: '#f3e8ff' },
            ...ESTADOS.map(e => ({ key: e, label: e, ...ESTADO_META[e] }))
          ].map(({ key, label, emoji, color, bg }) => (
            <button
              key={key}
              onClick={() => setFiltroEstado(key)}
              className="rounded-2xl p-3 text-left transition-all duration-200 active:scale-95"
              style={{
                background: filtroEstado === key ? color : 'white',
                border: `2px solid ${filtroEstado === key ? color : bg ?? '#f3e8ff'}`,
                boxShadow: filtroEstado === key ? `0 4px 14px ${color}44` : 'none',
              }}
            >
              <p className="text-xl mb-1">{emoji}</p>
              <p className="font-body font-black text-xl"
                 style={{ color: filtroEstado === key ? 'white' : color }}>
                {contadores[key] ?? 0}
              </p>
              <p className="text-[11px] font-body font-bold"
                 style={{ color: filtroEstado === key ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>
                {label}
              </p>
            </button>
          ))}
        </div>

        {/* ── Buscador ── */}
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por folio, nombre o teléfono..."
          className="w-full bg-white rounded-2xl px-4 py-3 text-sm font-body font-semibold
                     text-ink-900 placeholder:text-ink-300 outline-none border-2
                     border-ink-200 focus:border-fiesta-magenta transition-colors"
        />

        {/* ── Estados ── */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 rounded-full border-[3px] border-ink-200 border-t-fiesta-magenta animate-spin" />
            <span className="text-sm font-body font-bold text-ink-400">Cargando pedidos...</span>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl p-5 text-center border-2 border-red-100">
            <p className="text-sm font-body font-bold text-red-400">⚠️ {error}</p>
            <button onClick={fetchPedidos}
              className="mt-3 text-xs font-body font-black text-ink-500 underline">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && pedidosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-display text-lg text-ink-400">Sin pedidos</p>
          </div>
        )}

        {/* ── Grid de pedidos ── */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosFiltrados.map(pedido => (
              <TarjetaPedido
                key={pedido.id}
                pedido={pedido}
                onCambiarEstado={cambiarEstado}
                actualizando={actualizando}
                notificado={notificados[pedido.id] ?? null}
                onNotificar={(id, estado) =>
                  setNotificadosPersistente(prev => ({ ...prev, [id]: estado }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
