import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, ChevronDown, Package, LayoutGrid, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SIMBOLO_MONEDA } from '../data/productos';
import AdminCatalogo from './AdminCatalogo';

const ESTADOS = ['Por Surtir', 'Armando Pedido', 'Listo para Entrega'];

const ESTADO_META = {
  'Por Surtir':         { color: '#ef4444', bg: '#fee2e2', emoji: '🛍️' },
  'Armando Pedido':     { color: '#eab308', bg: '#fef9c3', emoji: '🎀' },
  'Listo para Entrega': { color: '#22c55e', bg: '#dcfce7', emoji: '🎉' },
};


// ── Notificación WhatsApp al cliente ────────────────────────────────────────
export function notificarCliente(pedido, articulosSurtidos = null) {
  const { cliente_nombre: nombre, cliente_telefono: tel, folio, estado } = pedido;

  // Diccionario de emojis blindado (Code Points) para WhatsApp Web en PC
  const EMOJI = {
    caja: String.fromCodePoint(0x1F4E6),    // 📦
    check: String.fromCodePoint(0x2705),    // ✅
    cruz: String.fromCodePoint(0x274C),     // ❌
    alerta: String.fromCodePoint(0x26A0),   // ⚠️
    dinero: String.fromCodePoint(0x1F4B0),  // 💰
    fiesta: String.fromCodePoint(0x1F389),  // 🎉
    bolsa: String.fromCodePoint(0x1F6CD),   // 🛍️
    mono: String.fromCodePoint(0x1F380),    // 🎀
    globo: String.fromCodePoint(0x1F388),   // 🎈
    festejo: String.fromCodePoint(0x1F973)  // 🥳
  };

  let mensaje = '';

  // 1. Lógica cuando el pedido está listo y tenemos la lista de surtido
  if (estado === 'Listo para Entrega' && articulosSurtidos) {
    const encontrados = articulosSurtidos.filter(a => a.encontrado);
    const faltantes   = articulosSurtidos.filter(a => !a.encontrado);
    const nuevoTotal  = encontrados.reduce((s, a) => s + a.precio * a.cantidad, 0);

    const listaEncontrados = encontrados
      .map(a => `  ${EMOJI.check} ${a.cantidad}x ${a.nombre} - ${SIMBOLO_MONEDA}${(a.precio * a.cantidad).toFixed(2)}`)
      .join('\n');

    const listaFaltantes = faltantes.length > 0
      ? `\n${EMOJI.alerta} *Lamentablemente no tuvimos en existencia:*\n` +
        faltantes.map(a => `  ${EMOJI.cruz} ${a.nombre}`).join('\n') + '\n'
      : '';

    mensaje =
      `¡Hola ${nombre}! Tu pedido *${folio}* ya está listo y empacado. ${EMOJI.caja}\n\n` +
      `*Artículos incluidos:*\n${listaEncontrados}\n` +
      listaFaltantes +
      `\n${EMOJI.dinero} *Tu total a pagar es: ${SIMBOLO_MONEDA}${nuevoTotal.toFixed(2)}*\n\n` +
      `¡Nos vemos pronto! ${EMOJI.fiesta}`;
      
  } else {
    // 2. Lógica para los demás estados
    switch (estado) {
      case 'Por Surtir':
        mensaje = `¡Hola ${nombre}! ${EMOJI.fiesta} Recibimos tu pedido *${folio}* y ya está en nuestro sistema. En breve comenzamos a prepararlo. ¡Gracias por tu compra! ${EMOJI.bolsa}`;
        break;
      case 'Armando Pedido':
        mensaje = `¡Hola ${nombre}! ${EMOJI.mono} Te confirmamos que ya estamos preparando tu pedido *${folio}*. En cuanto esté listo te avisamos. ¡Pronto la fiesta! ${EMOJI.globo}`;
        break;
      case 'Listo para Entrega':
        // Este caso se dispara si está "Listo" pero NO se pasó el array de articulosSurtidos
        mensaje = `¡Buenas noticias ${nombre}! ${EMOJI.fiesta} Tu pedido *${folio}* ya está listo. Puedes pasar a recogerlo o en breve saldrá a domicilio. ¡A celebrar! ${EMOJI.festejo}`;
        break;
      default:
        mensaje = `Hola ${nombre}, hay una actualización en tu pedido *${folio}*. Estado actual: ${estado}.`;
    }
  }

  // 3. Generación de URL Segura y apertura
  const telefonoLimpio = tel.replace(/[\s\-\(\)]/g, '');
  
  const params = new URLSearchParams({
    phone: `52${telefonoLimpio}`,
    text: mensaje
  });

  const url = `https://api.whatsapp.com/send?${params.toString()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ── Lista de artículos expandible + Picking dinámico ────────────────────────
function ItemArticulo({ item, modoPicking, encontrado, onToggle }) {
  const [imgError, setImgError] = useState(false);
  const subtotal = (item.precio * item.cantidad).toFixed(2);
  const tachado = !encontrado; // aplica en picking Y en vista de Listo para Entrega

  return (
    <div
      className="flex gap-3 py-3 border-b border-ink-100 last:border-0 transition-opacity duration-200"
      style={{ opacity: tachado ? 0.45 : 1 }}
    >
      {/* Checkbox picking — solo visible en modo Armando Pedido */}
      {modoPicking && (
        <button
          onClick={onToggle}
          className="flex-shrink-0 self-center w-7 h-7 rounded-lg border-2 flex items-center
                     justify-center transition-all duration-150 active:scale-90"
          style={{
            background:   encontrado ? '#22c55e' : 'white',
            borderColor:  encontrado ? '#22c55e' : '#d1d5db',
            boxShadow:    encontrado ? '0 2px 8px #22c55e44' : 'none',
          }}
          aria-label={encontrado ? 'Desmarcar' : 'Marcar como encontrado'}
        >
          {encontrado && (
            <svg viewBox="0 0 12 10" fill="none" className="w-3.5 h-3.5">
              <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      )}

      {/* Miniatura */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-ink-50
                      border-2 border-ink-100 flex items-center justify-center">
        {item.imagen_url && !imgError ? (
          <img src={item.imagen_url} alt={item.nombre} loading="lazy"
               onError={() => setImgError(true)}
               className="w-full h-full object-cover object-center"
               style={{ filter: tachado ? 'grayscale(1)' : 'none' }} />
        ) : (
          <Package size={20} className="text-ink-300" />
        )}
      </div>

      {/* Detalles */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-body font-black leading-snug line-clamp-2
                       ${tachado ? 'line-through text-ink-300' : 'text-ink-800'}`}>
          {item.nombre}
        </p>
        {item.tamano && (
          <p className="text-[11px] font-body text-ink-400 mt-0.5">Tamaño: {item.tamano}</p>
        )}
        {item.familia_mayoreo && (
          <p className="text-[11px] font-body text-ink-400">Mayoreo: {item.familia_mayoreo}</p>
        )}
        <p className="text-[11px] font-body text-ink-400">Cantidad: {item.cantidad}</p>
      </div>

      {/* Precio */}
      <div className="flex-shrink-0 text-right self-center">
        <p className={`text-sm font-body font-black
                       ${tachado ? 'line-through text-ink-300' : 'text-ink-800'}`}>
          {SIMBOLO_MONEDA}{subtotal}
        </p>
        <p className="text-[10px] font-body text-ink-400">{SIMBOLO_MONEDA}{item.precio.toFixed(2)} c/u</p>
      </div>
    </div>
  );
}

function ListaArticulos({ items, meta, estadoPedido, pedido, onPickingListo }) {
  const [abierto,          setAbierto]          = useState(estadoPedido === 'Armando Pedido');
  const [articulosSurtidos, setArticulosSurtidos] = useState(() =>
    items.map(i => ({ ...i, encontrado: i.encontrado ?? true }))
  );
  const [guardando, setGuardando] = useState(false);

  const modoPicking = estadoPedido === 'Armando Pedido';

  const nuevoTotal = articulosSurtidos
    .filter(a => a.encontrado)
    .reduce((s, a) => s + a.precio * a.cantidad, 0);

  const totalOriginal  = items.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const hayFaltantes   = articulosSurtidos.some(a => !a.encontrado);
  const todosEncontrados = articulosSurtidos.every(a => a.encontrado);

  async function toggleArticulo(idx) {
    const articulo    = articulosSurtidos[idx];
    const nuevoEstado = !articulo.encontrado;

    // Actualizar estado local inmediatamente
    setArticulosSurtidos(prev =>
      prev.map((a, i) => i === idx ? { ...a, encontrado: nuevoEstado } : a)
    );

    // Si se desmarca → marcar producto como agotado en Supabase
    // Si se vuelve a marcar → restaurar como disponible
    if (articulo.id) {
      const { error } = await supabase
        .from('productos')
        .update({ activo: nuevoEstado })
        .eq('id', articulo.id);

      if (error) {
        console.warn('[Picking] No se pudo actualizar activo del producto:', error.message);
      }
    }
  }

  async function pasarAListo() {
    setGuardando(true);

    // 1. Descontar el inventario automáticamente
    try {
      const encontrados = articulosSurtidos.filter(a => a.encontrado && a.id);
      
      await Promise.all(encontrados.map(async (art) => {
        const { data: prodData, error: errFetch } = await supabase
          .from('productos')
          .select('stock_actual, stock_ilimitado')
          .eq('id', art.id)
          .single();
          
        if (errFetch || !prodData || prodData.stock_ilimitado !== false) {
          return;
        }
        
        const stockActual = Number(prodData.stock_actual) || 0;
        let nuevoStock = stockActual - Number(art.cantidad);
        let activoFinal = true;

        if (nuevoStock <= 0) {
          nuevoStock = 0;
          activoFinal = false;
        }
        
        await supabase
          .from('productos')
          .update({
            stock_actual: nuevoStock,
            activo: activoFinal
          })
          .eq('id', art.id);
      }));
    } catch (err) {
      console.warn('[Picking] Falla parcial al actualizar inventario', err);
    }

    // 2. Actualizar el pedido
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado:        'Listo para Entrega',
        total:          nuevoTotal,
        detalles_json:  articulosSurtidos,
        notificado_estado: 'Listo para Entrega',
      })
      .eq('id', pedido.id);

    if (error) {
      alert('Error al guardar: ' + error.message);
      setGuardando(false);
      return;
    }

    // Notificar al cliente con mensaje dinámico
    notificarCliente(
      { ...pedido, estado: 'Listo para Entrega', total: nuevoTotal },
      articulosSurtidos
    );

    onPickingListo?.({
      ...pedido,
      estado:        'Listo para Entrega',
      total:          nuevoTotal,
      detalles_json:  articulosSurtidos,
      notificado_estado: 'Listo para Entrega',
    });
    setGuardando(false);
  }

  return (
    <div className="mb-3 rounded-xl overflow-hidden"
         style={{ border: `2px solid ${meta.bg}` }}>

      {/* Encabezado acordeón */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors duration-150"
        style={{ background: meta.bg }}
      >
        <span className="text-xs font-body font-black flex items-center gap-2" style={{ color: meta.color }}>
          {modoPicking ? '📋 Picking — Surtir Pedido' : '🛒 Lista de Artículos'}
          <span className="px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: meta.color, color: 'white' }}>
            {hayFaltantes
              ? `${articulosSurtidos.filter(a => a.encontrado).length}/${items.length}`
              : items.length}
          </span>
        </span>
        <ChevronDown size={16} style={{
          color: meta.color,
          transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
        }} />
      </button>

      {/* Contenido */}
      {abierto && (
        <div className="bg-white animate-fade-in">
          <div className="px-3">
            {articulosSurtidos.map((item, i) => (
              <ItemArticulo
                key={i}
                item={item}
                modoPicking={modoPicking}
                encontrado={item.encontrado}
                onToggle={() => toggleArticulo(i)}
              />
            ))}
          </div>

          {/* Panel resumen — en picking activo O si hay faltantes en Listo */}
          {(modoPicking || (estadoPedido === 'Listo para Entrega' && hayFaltantes)) && (
            <div className="mx-3 mb-3 mt-1 rounded-xl p-3 space-y-2"
                 style={{ background: '#f8f4ff', border: '2px solid #e0c4f8' }}>

              {/* Totales */}
              <div className="flex justify-between items-center text-xs font-body">
                <span className="text-ink-400 font-bold">Total original</span>
                <span className={`font-black ${hayFaltantes ? 'line-through text-ink-300' : 'text-ink-700'}`}>
                  {SIMBOLO_MONEDA}{totalOriginal.toFixed(2)}
                </span>
              </div>
              {hayFaltantes && (
                <div className="flex justify-between items-center text-xs font-body">
                  <span className="text-ink-400 font-bold">Artículos faltantes</span>
                  <span className="font-black text-red-400">
                    − {SIMBOLO_MONEDA}{(totalOriginal - nuevoTotal).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-purple-200">
                <span className="text-sm font-body font-black text-ink-800">
                  {hayFaltantes ? 'Nuevo total' : 'Total a cobrar'}
                </span>
                <span className="text-base font-body font-black" style={{ color: '#22c55e' }}>
                  {SIMBOLO_MONEDA}{nuevoTotal.toFixed(2)}
                </span>
              </div>

              {/* Advertencia faltantes */}
              {hayFaltantes && (
                <p className="text-[11px] font-body text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 leading-snug">
                  ⚠️ {articulosSurtidos.filter(a => !a.encontrado).length} artículo(s) sin existencia
                  — se descontarán del total y se notificará al cliente.
                </p>
              )}

              {/* Botón pasar a listo — solo visible en modo picking */}
              {modoPicking && (
                <button
                  onClick={pasarAListo}
                  disabled={guardando || nuevoTotal === 0}
                  className="w-full py-3 rounded-xl text-sm font-body font-black text-white
                             flex items-center justify-center gap-2
                             transition-all duration-200 active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    boxShadow: '0 3px 12px #22c55e44',
                  }}
                >
                  {guardando
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    : '🎉'
                  }
                  {guardando
                    ? 'Guardando...'
                    : todosEncontrados
                      ? 'Pedido Completo — Pasar a Listo'
                      : 'Guardar Picking y Pasar a Listo'
                  }
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TarjetaPedidoCompacta({ pedido, seleccionado, onClick }) {
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-3 border-2 transition-all duration-200"
      style={{
        background: seleccionado ? '#fff8fe' : 'white',
        borderColor: seleccionado ? meta.color : meta.bg,
        boxShadow: seleccionado ? `0 6px 18px ${meta.color}30` : '0 2px 10px rgba(26, 7, 51, 0.05)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm text-ink-900 truncate">{pedido.folio}</p>
        <span
          className="text-[10px] font-body font-black px-2 py-1 rounded-full"
          style={{ background: meta.bg, color: meta.color }}
        >
          {pedido.estado}
        </span>
      </div>

      <p className="mt-1 text-sm font-body font-bold text-ink-800 truncate">{pedido.cliente_nombre}</p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] font-body text-ink-400">Total</span>
        <span className="text-sm font-body font-black" style={{ color: meta.color }}>
          {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(2)}
        </span>
      </div>
    </button>
  );
}

// ── Tarjeta de un pedido ─────────────────────────────────────────────────────
function TarjetaPedido({ pedido, onCambiarEstado, actualizando, notificando, onNotificar, onPickingListo }) {
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha    = new Date(pedido.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const esActualizando = actualizando === pedido.id;
  // Notificado = el estado guardado en BD coincide con el estado actual
  const yaNotificado = pedido.notificado_estado === pedido.estado;

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

      {/* ── Acordeón de artículos / Picking ── */}
      {pedido.detalles_json?.length > 0 && (
        <ListaArticulos
          items={pedido.detalles_json}
          meta={meta}
          estadoPedido={pedido.estado}
          pedido={pedido}
          onPickingListo={onPickingListo}
        />
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
        onClick={() => !yaNotificado && !notificando && onNotificar(pedido)}
        disabled={yaNotificado || notificando}
        className="mt-3 w-full flex items-center justify-center gap-2
                   py-2.5 rounded-xl text-sm font-body font-black text-white
                   transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
        style={yaNotificado
          ? { background: '#d1fae5', color: '#6ee7b7', boxShadow: 'none' }
          : { background: 'linear-gradient(135deg, #25D366, #1db954)',
              boxShadow: '0 3px 12px #25D36633' }
        }
      >
        {notificando
          ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          : <MessageCircle size={16} />
        }
        {yaNotificado ? '✓ Cliente notificado' : notificando ? 'Enviando...' : 'Notificar al cliente'}
      </button>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────────────
function useAdminVistaInicial() {
  const [vista, setVista] = useState(() =>
    window.location.hash === '#/admin/catalogo' ? 'catalogo' : 'pedidos'
  );

  useEffect(() => {
    const sync = () => {
      setVista(window.location.hash === '#/admin/catalogo' ? 'catalogo' : 'pedidos');
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const setVistaYHash = (v) => {
    setVista(v);
    window.location.hash = v === 'catalogo' ? '#/admin/catalogo' : '#/admin';
  };

  return [vista, setVistaYHash];
}

export default function AdminPedidos({ user, onSignOut }) {
  const [vistaAdmin, setVistaAdmin] = useAdminVistaInicial();
  const [pedidos,      setPedidos]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [actualizando, setActualizando] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda,     setBusqueda]     = useState('');
  // { [pedidoId]: estadoEnQueSeNotificó } — se borra al cambiar estado
  const [notificando,  setNotificando]  = useState(null); // id del pedido siendo notificado
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);

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
      .update({ estado: nuevoEstado, notificado_estado: null })
      .eq('id', pedidoId);

    if (err) {
      alert('Error al actualizar: ' + err.message);
    } else {
      // Actualización optimista — Realtime lo propagará al resto de sesiones
      setPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado, notificado_estado: null } : p
      ));
    }
    setActualizando(null);
  }

  // ── Notificar al cliente (persiste en Supabase + Realtime) ─────────────────
  async function notificar(pedido) {
    setNotificando(pedido.id);
    notificarCliente(pedido); // abre WhatsApp
    const { error: err } = await supabase
      .from('pedidos')
      .update({ notificado_estado: pedido.estado })
      .eq('id', pedido.id);

    if (!err) {
      // Actualización optimista
      setPedidos(prev => prev.map(p =>
        p.id === pedido.id ? { ...p, notificado_estado: pedido.estado } : p
      ));
    }
    setNotificando(null);
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

  const pedidoSeleccionado = pedidosFiltrados.find(p => p.id === pedidoSeleccionadoId) ?? null;

  useEffect(() => {
    if (pedidosFiltrados.length === 0) {
      setPedidoSeleccionadoId(null);
      return;
    }
    if (!pedidoSeleccionadoId || !pedidosFiltrados.some(p => p.id === pedidoSeleccionadoId)) {
      setPedidoSeleccionadoId(pedidosFiltrados[0].id);
    }
  }, [pedidosFiltrados, pedidoSeleccionadoId]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#f8f4ff' }}>

      {/* ── Header admin (móvil: dos filas; sm+: una fila) ── */}
      <header
        className="sticky top-0 z-30 px-3 sm:px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        style={{
          background: 'linear-gradient(135deg, #1a0733, #3d1a6e)',
          boxShadow: '0 2px 20px #1a073340',
        }}
      >
        <div className="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto sm:flex-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span className="text-2xl shrink-0" aria-hidden>🎪</span>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg text-white leading-tight">Panel Admin</h1>
              <p
                className="text-[10px] sm:text-[11px] font-body text-purple-300 truncate mt-0.5"
                title={user?.email ?? ''}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={fetchPedidos}
              className="p-2 rounded-full text-purple-300 hover:text-white transition-colors"
              title="Actualizar"
              disabled={vistaAdmin !== 'pedidos'}
              style={{ opacity: vistaAdmin !== 'pedidos' ? 0.35 : 1 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                     0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-body font-black
                         text-purple-300 hover:text-white transition-colors border border-purple-700
                         hover:border-purple-400 whitespace-nowrap"
            >
              Salir
            </button>
          </div>
        </div>

        <nav className="flex items-stretch gap-1.5 w-full sm:w-auto sm:justify-end sm:shrink-0">
          <button
            type="button"
            onClick={() => setVistaAdmin('pedidos')}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 sm:py-1.5
                        rounded-xl text-[11px] font-body font-black transition-colors
                        ${vistaAdmin === 'pedidos' ? 'bg-white/15 text-white' : 'text-purple-300 hover:text-white'}`}
          >
            <ClipboardList size={14} className="shrink-0" />
            <span className="truncate">Pedidos</span>
          </button>
          <button
            type="button"
            onClick={() => setVistaAdmin('catalogo')}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 sm:py-1.5
                        rounded-xl text-[11px] font-body font-black transition-colors
                        ${vistaAdmin === 'catalogo' ? 'bg-white/15 text-white' : 'text-purple-300 hover:text-white'}`}
          >
            <LayoutGrid size={14} className="shrink-0" />
            <span className="truncate">Catálogo</span>
          </button>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4">

        {vistaAdmin === 'catalogo' && <AdminCatalogo />}

        {vistaAdmin === 'pedidos' && (
          <>
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

        {/* ── Grid móvil / vista dividida escritorio ── */}
        {!loading && !error && (
          <>
            {pedidos.length === 0 ? (
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center mb-3">
                  <ClipboardList size={28} className="text-purple-300" />
                </div>
                <p className="font-display text-2xl text-ink-700">Todo al día</p>
                <p className="text-sm font-body text-ink-400 mt-1">
                  No hay pedidos activos en este momento
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                  {pedidosFiltrados.map(pedido => (
                    <TarjetaPedido
                      key={pedido.id}
                      pedido={pedido}
                      onCambiarEstado={cambiarEstado}
                      actualizando={actualizando}
                      notificando={notificando === pedido.id}
                      onNotificar={notificar}
                      onPickingListo={(pedidoActualizado) =>
                        setPedidos(prev => prev.map(p =>
                          p.id === pedidoActualizado.id ? pedidoActualizado : p
                        ))
                      }
                    />
                  ))}
                </div>

                <div className="hidden lg:grid lg:grid-cols-[35%_65%] gap-4 h-[calc(100dvh-18rem)] min-h-[560px]">
                  <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-purple-100/80">
                      <p className="font-display text-base text-ink-900">Pedidos</p>
                      <p className="text-[11px] font-body text-ink-400 mt-0.5">
                        {pedidosFiltrados.length} resultado{pedidosFiltrados.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {pedidosFiltrados.map(pedido => (
                        <TarjetaPedidoCompacta
                          key={pedido.id}
                          pedido={pedido}
                          seleccionado={pedido.id === pedidoSeleccionadoId}
                          onClick={() => setPedidoSeleccionadoId(pedido.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-purple-100/80">
                      <p className="font-display text-base text-ink-900">Detalle del pedido</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {pedidoSeleccionado ? (
                        <TarjetaPedido
                          key={pedidoSeleccionado.id}
                          pedido={pedidoSeleccionado}
                          onCambiarEstado={cambiarEstado}
                          actualizando={actualizando}
                          notificando={notificando === pedidoSeleccionado.id}
                          onNotificar={notificar}
                          onPickingListo={(pedidoActualizado) =>
                            setPedidos(prev => prev.map(p =>
                              p.id === pedidoActualizado.id ? pedidoActualizado : p
                            ))
                          }
                        />
                      ) : (
                        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center">
                          <ClipboardList size={40} className="text-ink-300 mb-3" />
                          <p className="font-display text-xl text-ink-500">
                            Selecciona un pedido para ver los detalles
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}