import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { MessageCircle, ChevronDown, Package, LayoutGrid, ClipboardList, Search, RefreshCw, LogOut, ShoppingBag, Clock, CheckCircle2, XCircle, Phone, Truck, Store, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SIMBOLO_MONEDA } from '../data/productos';
import { notificarCliente } from '../utils/whatsapp';
import ThemeToggle from './ThemeToggle';
import { useToast } from './ui/ToastProvider';
import { SkeletonPedido } from './ui/Skeleton';
import BottomNav from './ui/BottomNav';
import ConfirmModal from './ui/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';
import { usePedidosAdmin, ESTADOS, ESTADOS_CON_CANCELADO } from '../hooks/usePedidosAdmin';
import { useDebounce } from '../hooks/useDebounce';

const AdminCatalogo = lazy(() => import('./AdminCatalogo'));

const ESTADO_META = {
  'Por Surtir':         { color: '#ef4444', bg: '#fee2e2', colorClass: 'text-status-pending',  bgClass: 'bg-status-pending-light',  borderClass: 'border-status-pending',  accentClass: 'bg-status-pending',  icon: ShoppingBag, activeStyle: { background: '#ef4444', color: 'white', boxShadow: '0 2px 8px #ef444455' }, inactiveStyle: { background: '#fee2e2', color: '#ef4444' } },
  'Armando Pedido':     { color: '#eab308', bg: '#fef9c3', colorClass: 'text-status-progress', bgClass: 'bg-status-progress-light', borderClass: 'border-status-progress', accentClass: 'bg-status-progress', icon: Clock, activeStyle: { background: '#eab308', color: 'white', boxShadow: '0 2px 8px #eab30855' }, inactiveStyle: { background: '#fef9c3', color: '#eab308' } },
  'Listo para Entrega': { color: '#22c55e', bg: '#dcfce7', colorClass: 'text-status-done',     bgClass: 'bg-status-done-light',     borderClass: 'border-status-done',     accentClass: 'bg-status-done',     icon: CheckCircle2, activeStyle: { background: '#22c55e', color: 'white', boxShadow: '0 2px 8px #22c55e55' }, inactiveStyle: { background: '#dcfce7', color: '#22c55e' } },
  'Cancelado':          { color: '#6b7280', bg: '#f3f4f6', colorClass: 'text-gray-500',        bgClass: 'bg-gray-100',              borderClass: 'border-gray-500',        accentClass: 'bg-gray-500',        icon: XCircle, activeStyle: { background: '#6b7280', color: 'white', boxShadow: '0 2px 8px #6b728055' }, inactiveStyle: { background: '#f3f4f6', color: '#6b7280' } },
};


// ── Helper puro: normalizar artículos para picking ──────────────────────────
function normalizarArticulos(lista, modoPicking) {
  return (lista || []).map(i => ({
    ...i,
    encontrado:
      typeof i.encontrado === 'boolean'
        ? i.encontrado
        : (modoPicking ? false : undefined),
  }));
}

// ── Lista de artículos expandible + Picking dinámico ────────────────────────
function ItemArticulo({ item, modoPicking, encontrado, onToggle, esDesktop }) {
  const [imgError, setImgError] = useState(false);
  const precioAplicado = Number(item.precio) || 0;
  const precioBase = Number(item.precio_base ?? item.precio_original ?? item.precio) || 0;
  const hayDescuento = precioAplicado < precioBase;
  const subtotal = (precioAplicado * item.cantidad).toFixed(2);
  const ahorroTotal = ((precioBase - precioAplicado) * item.cantidad).toFixed(2);
  const marcado = encontrado === true;
  const tachado = !modoPicking && encontrado === false;
  const pendientePicking = modoPicking && !marcado;
  const surtidoPicking = modoPicking && marcado;

  const claseFila = esDesktop
    ? 'flex items-center gap-2 lg:gap-3 py-1.5 lg:py-2 border-b border-admin-border-soft last:border-0 transition-opacity duration-150'
    : 'flex gap-3 py-3 border-b border-admin-border last:border-0 transition-opacity duration-200';

  const claseMiniatura = esDesktop
    ? 'w-9 h-9 lg:w-10 lg:h-10 rounded-lg overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border-soft flex items-center justify-center'
    : 'w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border-2 border-admin-border flex items-center justify-center';

  const claseCheckbox = esDesktop
    ? 'flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150 active:scale-90'
    : 'flex-shrink-0 self-center w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-150 active:scale-90';

  const clasePrecio = esDesktop
    ? 'text-xs font-body font-bold shrink-0'
    : 'flex-shrink-0 text-right self-center';

  return (
    <div
      className={`${claseFila} ${
        modoPicking
          ? `rounded-xl px-2 ${pendientePicking ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`
          : ''
      }`}
      style={{ opacity: tachado ? 0.45 : 1 }}
    >
      {modoPicking && (
        <button
          onClick={onToggle}
          className={claseCheckbox}
          style={{
            background: encontrado ? '#22c55e' : 'white',
            borderColor: encontrado ? '#22c55e' : '#d1d5db',
            boxShadow: encontrado ? '0 2px 8px #22c55e44' : 'none',
          }}
          aria-label={encontrado ? 'Desmarcar' : 'Marcar como encontrado'}
        >
          {marcado && (
            <svg viewBox="0 0 12 10" fill="none" className="w-2.5 h-2.5 lg:w-3 lg:h-3">
              <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      )}

      <div className={claseMiniatura}>
        {item.imagen_url && !imgError ? (
          <img src={item.imagen_url} alt={item.nombre} loading="lazy" onError={() => setImgError(true)}
               className="w-full h-full object-cover" style={{ filter: tachado ? 'grayscale(1)' : 'none' }} />
        ) : (
          <Package size={esDesktop ? 14 : 20} className="text-purple-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-body font-bold leading-snug line-clamp-1 ${tachado ? 'line-through text-admin-inactive' : 'text-admin-text'}`}>
          {item.nombre}
        </p>
        {modoPicking && (
          <span
            className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-body font-black ${
              pendientePicking ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {pendientePicking ? 'Pendiente por surtir' : 'Surtido'}
          </span>
        )}
        {hayDescuento && (
          <p className="text-[10px] font-body font-bold text-emerald-600 mt-0.5">
            Descuento mayoreo aplicado (-{SIMBOLO_MONEDA}{ahorroTotal})
          </p>
        )}
        {esDesktop && (
          <p className="text-[10px] font-body text-admin-muted">Cant: {item.cantidad}</p>
        )}
        {!esDesktop && item.tamano && (
          <p className="text-[11px] font-body text-admin-muted mt-0.5">Tamaño: {item.tamano}</p>
        )}
        {!esDesktop && item.familia_mayoreo && (
          <p className="text-[11px] font-body text-admin-muted">Mayoreo: {item.familia_mayoreo}</p>
        )}
        {!esDesktop && <p className="text-[11px] font-body text-admin-muted">Cantidad: {item.cantidad}</p>}
      </div>

      <div className={clasePrecio}>
        <p className={tachado ? 'line-through text-admin-inactive' : 'text-admin-text'}>
          {SIMBOLO_MONEDA}{subtotal}
        </p>
        {hayDescuento ? (
          <div className="text-right leading-tight">
            <p className="text-[10px] font-body text-admin-inactive line-through">
              {SIMBOLO_MONEDA}{precioBase.toFixed(2)} c/u
            </p>
            <p className="text-[10px] font-body font-bold text-emerald-600">
              {SIMBOLO_MONEDA}{precioAplicado.toFixed(2)} c/u
            </p>
          </div>
        ) : (
          !esDesktop && <p className="text-[10px] font-body text-admin-muted">{SIMBOLO_MONEDA}{precioAplicado.toFixed(2)} c/u</p>
        )}
      </div>
    </div>
  );
}

function ListaArticulos({ items, meta, estadoPedido, pedido, onPickingListo, esDesktop }) {
  const toast = useToast();
  const modoPicking = estadoPedido === 'Armando Pedido';

  const [abierto,          setAbierto]          = useState(estadoPedido === 'Armando Pedido');
  const [articulosSurtidos, setArticulosSurtidos] = useState(() => normalizarArticulos(items, modoPicking));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setArticulosSurtidos(normalizarArticulos(items, modoPicking));
  }, [items, modoPicking, pedido?.id, pedido?.updated_at, pedido?.estado]);

  const nuevoTotal = articulosSurtidos
    .filter(a => a.encontrado === true)
    .reduce((s, a) => s + a.precio * a.cantidad, 0);

  const totalOriginal  = items.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const hayFaltantes   = articulosSurtidos.some(a => a.encontrado === false);
  const todosEncontrados = articulosSurtidos.every(a => a.encontrado === true);

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
        
        const updatePayload = {
          stock_actual: nuevoStock > 0 ? nuevoStock : 0
        };

        // REGLA DE AUTO-APAGADO: Solo modificar "activo" si el stock se agotó
        // Si aún hay stock, omitimos enviar "activo" para no sobreescribir su estado manual anterior
        if (nuevoStock <= 0) {
          updatePayload.activo = false;
        }
        
        await supabase
          .from('productos')
          .update(updatePayload)
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
      toast.error('Error al guardar: ' + error.message);
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
        aria-expanded={abierto}
      >
        <span className="text-xs font-body font-black flex items-center gap-2" style={{ color: meta.color }}>
          {modoPicking ? 'Picking — Surtir Pedido' : 'Lista de Artículos'}
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

      {/* Progress bar for picking */}
      {modoPicking && abierto && (
        <div className="h-1 bg-admin-elevated">
          <div
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${items.length > 0 ? (articulosSurtidos.filter(a => a.encontrado).length / items.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Contenido */}
      {abierto && (
        <div className={`bg-admin-card animate-fade-in ${esDesktop ? 'px-2 lg:px-3' : 'px-3'}`}>
          {modoPicking && (
            <div className="flex items-center gap-2 px-1 py-2">
              <p className="text-[11px] font-body font-bold text-amber-600 flex-1">
                Marca solo lo surtido. Lo que quede sin marcar se tomará como faltante.
              </p>
              <span className="text-xs font-body font-black text-admin-text whitespace-nowrap">
                {articulosSurtidos.filter(a => a.encontrado).length}/{items.length}
              </span>
            </div>
          )}
          <div>
            {/* Sort: pending first, surtidos at bottom in picking mode */}
            {(modoPicking
              ? [...articulosSurtidos.filter(a => !a.encontrado), ...articulosSurtidos.filter(a => a.encontrado)]
              : articulosSurtidos
            ).map((item, _i) => {
              const originalIdx = articulosSurtidos.indexOf(item);
              return (
                <div
                  key={originalIdx}
                  onClick={modoPicking ? () => toggleArticulo(originalIdx) : undefined}
                  className={modoPicking ? 'cursor-pointer' : ''}
                  role={modoPicking ? 'button' : undefined}
                  tabIndex={modoPicking ? 0 : undefined}
                  onKeyDown={modoPicking ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleArticulo(originalIdx); } } : undefined}
                >
                  <ItemArticulo
                    item={item}
                    modoPicking={modoPicking}
                    encontrado={item.encontrado}
                    onToggle={() => toggleArticulo(originalIdx)}
                    esDesktop={esDesktop}
                  />
                </div>
              );
            })}
          </div>

          {/* Panel resumen — en picking activo O si hay faltantes en Listo */}
          {(modoPicking || (estadoPedido === 'Listo para Entrega' && hayFaltantes)) && (
            <div className={`rounded-xl p-3 space-y-2 ${esDesktop ? 'mx-2 mt-2 mb-2' : 'mx-3 mb-3 mt-1'} bg-admin-elevated border-2 border-admin-border`}>

              {/* Totales */}
              <div className="flex justify-between items-center text-xs font-body">
                <span className="text-admin-muted font-bold">Total original</span>
                <span className={`font-black ${hayFaltantes ? 'line-through text-admin-inactive' : 'text-admin-text-secondary'}`}>
                  {SIMBOLO_MONEDA}{totalOriginal.toFixed(2)}
                </span>
              </div>
              {hayFaltantes && (
                <div className="flex justify-between items-center text-xs font-body">
                  <span className="text-admin-muted font-bold">Artículos faltantes</span>
                  <span className="font-black text-red-400">
                    − {SIMBOLO_MONEDA}{(totalOriginal - nuevoTotal).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-admin-border">
                <span className="text-sm font-body font-black text-admin-text">
                  {hayFaltantes ? 'Nuevo total' : 'Total a cobrar'}
                </span>
                <span className="text-base font-body font-black text-status-done">
                  {SIMBOLO_MONEDA}{nuevoTotal.toFixed(2)}
                </span>
              </div>

              {/* Advertencia faltantes */}
              {hayFaltantes && (
                <p className="text-[11px] font-body text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 leading-snug">
                  <span aria-hidden="true">⚠️</span> {articulosSurtidos.filter(a => !a.encontrado).length} artículo(s) sin existencia
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
                    : <CheckCircle2 size={16} />
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
  const initials = pedido.cliente_nombre
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '??';

  // Relative timestamp
  const diffMs = Date.now() - new Date(pedido.created_at).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const timeAgo = diffMin < 1 ? 'ahora' : diffMin < 60 ? `${diffMin}m` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h` : `${Math.floor(diffMin / 1440)}d`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left rounded-xl p-3 pl-5 border transition-all duration-200 overflow-hidden
                  ${seleccionado ? 'bg-admin-elevated border-admin-border shadow-card-hover' : 'bg-admin-card border-transparent hover:bg-admin-elevated'}`}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${meta.accentClass}`} />

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${meta.bgClass} ${meta.colorClass}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-body font-bold text-sm text-admin-text truncate">{pedido.cliente_nombre}</p>
            <span className="text-[10px] font-body text-admin-muted flex-shrink-0">{timeAgo}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs font-body text-admin-muted truncate">{pedido.folio}</span>
            <span className={`text-xs font-body font-black flex-shrink-0 ${meta.colorClass}`}>
              {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Tarjeta de un pedido ─────────────────────────────────────────────────────
function TarjetaPedido({ pedido, onCambiarEstado, actualizando, notificando, onNotificar, onPickingListo, onCancelar, esDesktop }) {
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha    = new Date(pedido.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const esActualizando = actualizando === pedido.id;
  const yaNotificado = pedido.notificado_estado === pedido.estado;

  const claseHeader = esDesktop
    ? 'flex items-center justify-between gap-3 pb-3 mb-3 border-b border-admin-border-soft'
    : 'flex items-start justify-between gap-2 mb-3';

  const claseInfoCliente = esDesktop
    ? 'pb-2 mb-2 border-b border-admin-border-soft'
    : 'space-y-1 mb-3 pb-3 border-b border-admin-border';

  const claseTotal = esDesktop
    ? 'flex items-center justify-end gap-3 pb-3 border-b border-admin-border-soft'
    : 'flex items-center justify-between mb-3';

  const claseBotones = esDesktop
    ? 'flex flex-wrap items-center justify-end gap-2'
    : 'flex flex-col gap-1.5';

  const claseBotonEstado = esDesktop
    ? 'py-1.5 px-3 min-w-[142px] rounded-lg text-xs font-body font-bold whitespace-nowrap transition-all duration-200 active:scale-95 disabled:cursor-default'
    : 'py-3.5 px-4 rounded-xl text-sm font-body font-bold w-full transition-all duration-200 active:scale-95 disabled:cursor-default';

  return (
    <div
      className="bg-admin-card rounded-2xl p-5 transition-all duration-300 border border-admin-border shadow-card"
      style={{
        opacity: esActualizando ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div className={claseHeader}>
        <div className="flex items-center gap-3">
          <span className={`font-body font-bold text-admin-text ${esDesktop ? 'text-sm' : 'text-base'}`}>{pedido.folio}</span>
          {!esDesktop && <p className="text-[11px] font-body text-admin-muted mt-0.5">{fecha}</p>}
        </div>
        <span
          className={`text-xs font-body font-bold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1.5 ${meta.bgClass} ${meta.colorClass}`}
        >
          <meta.icon size={14} strokeWidth={2.5} /> {pedido.estado}
        </span>
      </div>

      {/* Info cliente */}
      <div className={claseInfoCliente}>
        <p className="text-sm font-body font-bold text-admin-text">{pedido.cliente_nombre}</p>
        <p className="flex items-center gap-1.5 text-xs font-body text-admin-muted"><Phone size={12} /> {pedido.cliente_telefono}</p>
        <p className="flex items-center gap-1.5 text-xs font-body text-admin-muted">
          {pedido.tipo_entrega === 'envio' ? <><Truck size={12} /> Envío a domicilio</> : <><Store size={12} /> Recoger en tienda</>}
        </p>
        {pedido.direccion && (
          <p className="flex items-center gap-1.5 text-xs font-body text-admin-muted leading-relaxed"><MapPin size={12} className="flex-shrink-0" /> {pedido.direccion}</p>
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
          esDesktop={esDesktop}
        />
      )}

      {/* Total */}
      <div className={claseTotal}>
        <span className="text-xs font-body text-admin-muted font-bold">Total</span>
        <span className={`font-body font-black ${esDesktop ? 'text-lg' : 'text-base'} ${meta.colorClass}`}>
          {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(2)}
        </span>
      </div>

      {/* Selector de estado */}
      <div className="relative mb-3">
        {esActualizando && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl bg-admin-card/80">
            <div className="w-4 h-4 rounded-full border-2 border-ink-200 border-t-ink-600 animate-spin" />
          </div>
        )}
        {/* Mobile: full-width button stack */}
        {!esDesktop && (
          <div className={claseBotones}>
            {ESTADOS.map(estado => {
              const m = ESTADO_META[estado];
              const activo = pedido.estado === estado;
              return (
                <button
                  key={estado}
                  onClick={() => !activo && onCambiarEstado(pedido.id, estado)}
                  disabled={activo || esActualizando}
                  className={claseBotonEstado}
                  style={activo ? m.activeStyle : m.inactiveStyle}
                >
                  <span className="flex items-center gap-2">
                    <m.icon size={18} strokeWidth={2.5} />
                    <span>{estado}</span>
                  </span>
                  {activo && <CheckCircle2 size={16} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        )}
        {/* Desktop: button grid */}
        {esDesktop && (
          <div className={claseBotones}>
            {ESTADOS.map(estado => {
              const m       = ESTADO_META[estado];
              const activo  = pedido.estado === estado;
              return (
                <button
                  key={estado}
                  onClick={() => !activo && onCambiarEstado(pedido.id, estado)}
                  disabled={activo || esActualizando}
                  className={claseBotonEstado}
                  style={activo ? m.activeStyle : m.inactiveStyle}
                >
                  <m.icon size={14} className="inline mr-1" /> {estado}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botones de acción: notificar + cancelar */}
      <div className={`flex items-center gap-2 ${esDesktop ? 'justify-end' : 'flex-col'}`}>
        {/* Botón cancelar pedido */}
        {pedido.estado !== 'Cancelado' && (
          <button
            onClick={() => onCancelar(pedido)}
            disabled={esActualizando}
            title="Cancelar pedido"
            className={`flex items-center justify-center gap-1.5 rounded-xl font-body font-bold
                       transition-all duration-200 active:scale-95 disabled:opacity-50
                       border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500
                       ${esDesktop ? 'py-2 px-3 text-xs' : 'py-2.5 w-full text-xs order-2'}`}
          >
            <XCircle size={14} />
            {!esDesktop && 'Cancelar pedido'}
          </button>
        )}

        {/* Indicador de pedido cancelado */}
        {pedido.estado === 'Cancelado' && (
          <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-body font-bold
                          ${esDesktop ? '' : 'w-full order-2'}`}
               style={{ background: '#f3f4f6', color: '#6b7280' }}>
            <XCircle size={14} />
            Pedido cancelado
          </div>
        )}

        {/* Botón notificar por WhatsApp */}
        <button
          onClick={() => !yaNotificado && !notificando && onNotificar(pedido)}
          disabled={yaNotificado || notificando}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-black text-white
                     transition-all duration-200 active:scale-95 disabled:cursor-not-allowed
                     ${esDesktop ? 'flex-1 max-w-[220px]' : 'w-full order-1'}`}
          style={yaNotificado
            ? { background: '#d1fae5', color: '#6ee7b7', boxShadow: 'none' }
            : { background: 'linear-gradient(135deg, #25D366, #1db954)', boxShadow: '0 3px 12px #25D36633' }
          }
        >
          {notificando
            ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            : <MessageCircle size={16} />
          }
          {yaNotificado ? '✓ Cliente notificado' : notificando ? 'Enviando...' : 'Notificar al cliente'}
        </button>
      </div>
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

export default function AdminPedidos({ user, onSignOut, temaOscuro, onToggleTema }) {
  const toast = useToast();
  const { isOpen: cancelConfirmOpen, config: cancelConfig, confirm: confirmCancelar, onConfirm: onConfirmCancelar, onCancel: onCancelCancelar } = useConfirm();
  const [vistaAdmin, setVistaAdmin] = useAdminVistaInicial();
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaDebounced = useDebounce(busquedaInput, 300);

  const {
    pedidos, setPedidos, loading, error,
    actualizando, filtroEstado, setFiltroEstado,
    busqueda, setBusqueda, notificando,
    pedidoSeleccionadoId, setPedidoSeleccionadoId,
    fetchPedidos, pedidosFiltrados, contadores,
    pedidoSeleccionado,
    cambiarEstado, cancelarPedido, notificar,
  } = usePedidosAdmin({ toast, confirmCancelar });

  // Sincronizar debounce → hook
  useEffect(() => { setBusqueda(busquedaDebounced); }, [busquedaDebounced, setBusqueda]);

  return (
    <div className="min-h-screen bg-admin-bg lg:flex lg:h-screen lg:overflow-hidden">
      <ConfirmModal
        open={cancelConfirmOpen}
        {...cancelConfig}
        onConfirm={onConfirmCancelar}
        onCancel={onCancelCancelar}
      />
      {/* Skip link */}
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-admin-card focus:text-admin-text focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-elevated focus:text-sm focus:font-body focus:font-bold">
        Saltar al contenido
      </a>

      {/* ── Sidebar Nativo (Desktop) / Header (Mobile) ── */}
      <header className="sticky top-0 z-30 border-b border-admin-border backdrop-blur-md lg:static lg:h-full lg:w-64 lg:flex-shrink-0 lg:flex lg:flex-col lg:border-b-0 lg:border-r" style={{ backgroundColor: 'var(--admin-card)' }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 lg:gap-0 lg:p-0 lg:flex-1">
          {/* ── Brand Header ── */}
          <div className="flex items-center justify-between gap-2 min-w-0 lg:flex-col lg:items-start lg:gap-0 lg:p-6 lg:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center shrink-0 text-white font-display text-sm shadow-card">
                FP
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg text-admin-text leading-tight">Full Party</h1>
                <p className="text-[11px] sm:text-xs font-body text-admin-muted truncate mt-0.5" title={user?.email ?? ''}>
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 lg:hidden">
              <button
                type="button"
                onClick={fetchPedidos}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-bold text-admin-text-secondary hover:text-admin-text bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors disabled:opacity-50"
                title="Actualizar pedidos"
                aria-label="Actualizar pedidos"
                disabled={vistaAdmin !== 'pedidos'}
              >
                <RefreshCw size={14} />
              </button>
              <ThemeToggle isDarkMode={temaOscuro} onToggle={onToggleTema} variant="admin" />
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center p-2 rounded-lg text-admin-muted bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* ── Nav Items (hidden on mobile — BottomNav handles it) ── */}
          <nav className="hidden lg:flex lg:flex-col lg:w-full lg:px-3 lg:gap-1" aria-label="Secciones admin">
            <button
              type="button"
              onClick={() => setVistaAdmin('pedidos')}
              aria-current={vistaAdmin === 'pedidos' ? 'page' : undefined}
              className={`relative flex items-center gap-2.5 px-1 py-3 lg:px-3 lg:py-2.5 text-sm font-body font-bold transition-all lg:rounded-xl lg:border-none border-b-[3px] 
                         ${vistaAdmin === 'pedidos'
                           ? 'text-admin-text border-admin-text lg:bg-admin-elevated lg:border-l-[3px] lg:border-l-fiesta-magenta lg:border-b-0'
                           : 'text-admin-muted border-transparent hover:text-admin-text lg:hover:bg-admin-elevated'}`}
            >
              <ClipboardList size={18} />
              Pedidos
              {(contadores['Por Surtir'] ?? 0) > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {contadores['Por Surtir']}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setVistaAdmin('catalogo')}
              aria-current={vistaAdmin === 'catalogo' ? 'page' : undefined}
              className={`flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2.5 px-1 py-3 lg:px-3 lg:py-2.5 text-sm font-body font-bold transition-all lg:rounded-xl lg:border-none border-b-[3px] ml-4 lg:ml-0
                         ${vistaAdmin === 'catalogo'
                           ? 'text-admin-text border-admin-text lg:bg-admin-elevated lg:border-l-[3px] lg:border-l-fiesta-magenta lg:border-b-0'
                           : 'text-admin-muted border-transparent hover:text-admin-text lg:hover:bg-admin-elevated'}`}
            >
              <LayoutGrid size={18} />
              Catálogo
            </button>
          </nav>

          {/* ── Quick Stats (Desktop only) ── */}
          <div className="hidden lg:block px-6 pt-4 mt-4 border-t border-admin-border">
            <p className="text-[10px] font-body font-bold text-admin-muted uppercase tracking-wider mb-3">Hoy</p>
            <div className="space-y-2">
              {ESTADOS_CON_CANCELADO.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs font-body">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_META[e].color }} />
                  <span className="text-admin-muted truncate flex-1">{e}</span>
                  <span className="font-bold text-admin-text">{contadores[e] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar Footer (Desktop only) ── */}
          <div className="hidden lg:flex flex-col gap-3 mt-auto px-6 pt-6 pb-6 border-t border-admin-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body font-bold text-admin-muted">Tema</span>
              <ThemeToggle isDarkMode={temaOscuro} onToggle={onToggleTema} variant="admin" />
            </div>
            <button
              type="button"
              onClick={fetchPedidos}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-bold text-admin-text-secondary bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
            >
              <RefreshCw size={14} />
              Recargar datos
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-transparent transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main id="admin-main" className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4 lg:p-8 lg:max-w-7xl">

        {vistaAdmin === 'catalogo' && (
          <>
            <h2 className="sr-only">Catálogo de productos</h2>
            <Suspense fallback={
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-admin-border border-t-fiesta-magenta animate-spin" />
                <span className="text-sm font-body font-bold text-admin-muted">Cargando catálogo…</span>
              </div>
            }>
              <AdminCatalogo />
            </Suspense>
          </>
        )}

        {vistaAdmin === 'pedidos' && (
          <>
            <h2 className="sr-only">Gestión de pedidos</h2>
        <section className="bg-admin-card rounded-2xl border border-admin-border p-4 sm:p-5 space-y-4 shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[{ key: 'todos', label: 'Total', icon: ClipboardList, color: '#6b35b8', bg: '#f3e8ff' },
              ...ESTADOS_CON_CANCELADO.map(e => ({ key: e, label: e, ...ESTADO_META[e] }))
            ].map(({ key, label, icon: IconComponent, color, bg }) => {
              const isActive = filtroEstado === key;
              return (
                <button
                  key={key}
                  onClick={() => setFiltroEstado(key)}
                  className={`group relative flex items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] border overflow-hidden
                              ${isActive ? 'border-transparent ring-2 ring-offset-2 shadow-card-hover' : 'border-admin-border bg-admin-card hover:border-admin-border-soft text-admin-text shadow-card'}`}
                  style={isActive ? { background: color, ringColor: color, '--tw-ring-color': color } : undefined}
                >
                  {/* Accent bar */}
                  {!isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: color }} />}
                  {/* Icon circle */}
                  <div
                    className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: isActive ? 'rgba(255,255,255,0.2)' : bg }}
                  >
                    <IconComponent size={18} style={{ color: isActive ? '#fff' : color }} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-body font-black text-2xl sm:text-xl leading-none tabular-nums ${isActive ? 'text-white' : ''}`} role="status">
                      {contadores[key] ?? 0}
                    </p>
                    <p className={`text-[10px] sm:text-xs font-body font-bold mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-admin-muted'}`}>
                      {label}
                    </p>
                  </div>
                  {/* Live dot for "Por Surtir" */}
                  {key === 'Por Surtir' && (contadores[key] ?? 0) > 0 && (
                    <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full animate-[pulseLive_2s_ease-in-out_infinite] border-2 border-white ${isActive ? 'bg-white' : 'bg-red-500'}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
            <input
              type="text"
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
              placeholder="Buscar por folio, nombre o teléfono..."
              className="w-full bg-admin-input rounded-2xl pl-9 pr-9 py-3 text-sm font-body font-semibold
                         text-admin-text placeholder:text-admin-inactive outline-none border-2
                         border-admin-border focus:border-fiesta-magenta transition-colors"
            />
            {busquedaInput && (
              <button
                type="button"
                onClick={() => setBusquedaInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-inactive hover:text-admin-muted"
                aria-label="Limpiar búsqueda"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* ── Estados ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 py-4">
            {[1,2,3].map(i => <SkeletonPedido key={i} />)}
          </div>
        )}

        {error && (
          <div className="bg-admin-card rounded-2xl p-5 text-center border-2 border-red-100" role="alert">
            <p className="text-sm font-body font-bold text-red-400"><span aria-hidden="true">⚠️</span> {error}</p>
            <button onClick={fetchPedidos}
              className="mt-3 text-xs font-body font-black text-admin-muted underline">
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
                <p className="font-body font-semibold text-xl text-admin-text-secondary">Todo al día</p>
                <p className="text-sm font-body text-admin-muted mt-1">
                  No hay pedidos activos en este momento
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4" aria-live="polite">
                  {pedidosFiltrados.map(pedido => (
                    <TarjetaPedido
                      key={pedido.id}
                      pedido={pedido}
                      onCambiarEstado={cambiarEstado}
                      actualizando={actualizando}
                      notificando={notificando === pedido.id}
                      onNotificar={notificar}
                      onCancelar={cancelarPedido}
                      onPickingListo={(pedidoActualizado) =>
                        setPedidos(prev => prev.map(p =>
                          p.id === pedidoActualizado.id ? pedidoActualizado : p
                        ))
                      }
                      esDesktop={false}
                    />
                  ))}
                </div>

                <div className="hidden lg:grid lg:grid-cols-[32%_68%] gap-4 h-[calc(100dvh-18rem)] min-h-[560px]">
                  <div className="bg-admin-card rounded-2xl border border-admin-border overflow-hidden flex flex-col shadow-card">
                    <div className="px-5 py-4 border-b border-admin-border">
                      <p className="font-body font-semibold text-sm text-admin-text">Pedidos</p>
                      <p className="text-xs font-body font-bold text-admin-muted mt-0.5">
                        {pedidosFiltrados.length} resultado{pedidosFiltrados.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                      {/* Grouped by status */}
                      {ESTADOS_CON_CANCELADO.map(estado => {
                        const grupo = pedidosFiltrados.filter(p => p.estado === estado);
                        if (grupo.length === 0) return null;
                        const m = ESTADO_META[estado];
                        return (
                          <div key={estado} className="mb-3">
                            <div className="sticky top-0 z-10 flex items-center gap-2 px-2 py-1.5 bg-admin-card/95 backdrop-blur-sm">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                              <span className="text-[10px] font-body font-bold text-admin-muted uppercase tracking-wider">{estado}</span>
                              <span className="text-[10px] font-body text-admin-inactive">{grupo.length}</span>
                            </div>
                            <div className="space-y-1">
                              {grupo.map(pedido => (
                                <TarjetaPedidoCompacta
                                  key={pedido.id}
                                  pedido={pedido}
                                  seleccionado={pedido.id === pedidoSeleccionadoId}
                                  onClick={() => setPedidoSeleccionadoId(pedido.id)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-admin-card rounded-2xl border border-admin-border overflow-hidden flex flex-col shadow-card">
                    <div className="px-5 py-4 border-b border-admin-border">
                      <p className="font-body font-semibold text-sm text-admin-text">Detalle del pedido</p>
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
                          onCancelar={cancelarPedido}
                          onPickingListo={(pedidoActualizado) =>
                            setPedidos(prev => prev.map(p =>
                              p.id === pedidoActualizado.id ? pedidoActualizado : p
                            ))
                          }
                          esDesktop={true}
                        />
                      ) : (
                        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center">
                          <ClipboardList size={40} className="text-admin-muted mb-3" />
                          <p className="font-body font-medium text-lg text-admin-muted">
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
      {/* Mobile bottom padding for BottomNav */}
      <div className="h-16 lg:hidden" />
      </main>

      {/* ── Bottom Navigation (Mobile) ── */}
      <BottomNav
        active={vistaAdmin}
        onChange={setVistaAdmin}
        badge={contadores['Por Surtir'] ?? 0}
        onSignOut={onSignOut}
      />
    </div>
  );
}
