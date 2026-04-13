import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { MessageCircle, ChevronDown, Package, LayoutGrid, ClipboardList, Search, RefreshCw, LogOut, ShoppingBag, Clock, CheckCircle2, XCircle, Phone, Truck, Store, MapPin, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SIMBOLO_MONEDA } from '../data/productos';
import { notificarCliente } from '../utils/whatsapp';
import { obtenerPrecioAplicable } from '../utils/precios';
import ThemeToggle from './ThemeToggle';
import { useToast } from './ui/ToastProvider';
import { SkeletonPedido } from './ui/Skeleton';
import BottomNav from './ui/BottomNav';
import ConfirmModal from './ui/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';
import { usePedidosAdmin, ESTADOS, ESTADOS_CON_CANCELADO } from '../hooks/usePedidosAdmin';
import { useDebounce } from '../hooks/useDebounce';
import { useLanguage } from '../hooks/useLanguage';

const AdminCatalogo = lazy(() => import('./AdminCatalogo'));

const ESTADO_META = {
  'Por Surtir':         { color: '#ef4444', bg: '#fee2e2', colorClass: 'text-status-pending',  bgClass: 'bg-status-pending-light',  borderClass: 'border-status-pending',  accentClass: 'bg-status-pending',  icon: ShoppingBag, activeStyle: { background: '#ef4444', color: 'white', boxShadow: '0 2px 8px #ef444455' }, inactiveStyle: { background: '#fee2e2', color: '#ef4444' } },
  'Armando Pedido':     { color: '#eab308', bg: '#fef9c3', colorClass: 'text-status-progress', bgClass: 'bg-status-progress-light', borderClass: 'border-status-progress', accentClass: 'bg-status-progress', icon: Clock, activeStyle: { background: '#eab308', color: 'white', boxShadow: '0 2px 8px #eab30855' }, inactiveStyle: { background: '#fef9c3', color: '#eab308' } },
  'Listo para Entrega': { color: '#22c55e', bg: '#dcfce7', colorClass: 'text-status-done',     bgClass: 'bg-status-done-light',     borderClass: 'border-status-done',     accentClass: 'bg-status-done',     icon: CheckCircle2, activeStyle: { background: '#22c55e', color: 'white', boxShadow: '0 2px 8px #22c55e55' }, inactiveStyle: { background: '#dcfce7', color: '#22c55e' } },
  'Cancelado':          { color: '#6b7280', bg: '#f3f4f6', colorClass: 'text-gray-500',        bgClass: 'bg-gray-100',              borderClass: 'border-gray-500',        accentClass: 'bg-gray-500',        icon: XCircle, activeStyle: { background: '#6b7280', color: 'white', boxShadow: '0 2px 8px #6b728055' }, inactiveStyle: { background: '#f3f4f6', color: '#6b7280' } },
};

function estadoLabel(estado, t) {
  if (estado === 'Por Surtir') return t('tracking.status.pending');
  if (estado === 'Armando Pedido') return t('tracking.status.preparing');
  if (estado === 'Listo para Entrega') return t('tracking.status.ready');
  if (estado === 'Cancelado') return t('admin.orders.status.cancelled');
  return estado;
}


// ── Helper puro: normalizar artículos para picking ──────────────────────────
function normalizarArticulos(lista, modoPicking) {
  return (lista || []).map(i => {
    const cantidadPedida = Number(i.cantidad) || 1;
    let cantidadSurtida;
    if (typeof i.cantidad_surtida === 'number') {
      cantidadSurtida = i.cantidad_surtida;
    } else if (typeof i.encontrado === 'boolean') {
      cantidadSurtida = i.encontrado ? cantidadPedida : 0;
    } else {
      // For new picking sessions, items start unselected (0)
      cantidadSurtida = modoPicking ? 0 : cantidadPedida;
    }
    return {
      ...i,
      cantidad_surtida: cantidadSurtida,
      encontrado: cantidadSurtida > 0,
    };
  });
}

// ── Lista de artículos expandible + Picking dinámico ────────────────────────
function ItemArticulo({ item, modoPicking, encontrado, onToggle, onCantidadChange, esDesktop }) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const precioSurtido = Number(item.precio_surtido ?? item.precio) || 0;
  const precioAplicado = Number(item.precio) || 0;
  const precioBase = Number(item.precio_base ?? item.precio_original ?? item.precio) || 0;
  const cantidadPedida = Number(item.cantidad) || 1;
  const cantidadSurtida = Number(item.cantidad_surtida ?? item.cantidad) || 0;
  const marcado = cantidadSurtida > 0;
  const completo = cantidadSurtida === cantidadPedida;
  const parcial = cantidadSurtida > 0 && cantidadSurtida < cantidadPedida;
  const tachado = !modoPicking && cantidadSurtida === 0 && encontrado === false;
  const pendientePicking = modoPicking && !marcado;
  const surtidoPicking = modoPicking && marcado;
  const precioMostrar = modoPicking && marcado ? precioSurtido : precioAplicado;
  const hayDescuento = precioMostrar < precioBase;
  const cambioPrecioMayoreo = modoPicking && marcado && precioSurtido !== precioAplicado;
  // In picking mode use fulfilled quantity when selected; post-picking uses persisted cantidad_surtida
  const cantidadParaSubtotal = modoPicking
    ? (marcado ? cantidadSurtida : cantidadPedida)
    : (typeof item.cantidad_surtida === 'number' ? cantidadSurtida : cantidadPedida);
  const subtotal = (precioMostrar * cantidadParaSubtotal).toFixed(2);
  const ahorroTotal = ((precioBase - precioMostrar) * (modoPicking && marcado ? cantidadSurtida : cantidadPedida)).toFixed(2);

  const claseFila = esDesktop
    ? 'flex items-center gap-3 py-3 border-b border-admin-border-soft last:border-0 transition-opacity duration-150'
    : 'flex gap-3 py-3 border-b border-admin-border last:border-0 transition-opacity duration-200';

  const claseMiniatura = esDesktop
    ? 'w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border-soft flex items-center justify-center'
    : 'w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border-2 border-admin-border flex items-center justify-center';

  const claseCheckbox = esDesktop
    ? 'flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 active:scale-90'
    : 'flex-shrink-0 self-center w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-150 active:scale-90';

  const clasePrecio = esDesktop
    ? 'text-sm font-body font-bold shrink-0'
    : 'flex-shrink-0 text-right self-center';

  return (
    <>
    <div
      className={`${claseFila} ${
        modoPicking
          ? `rounded-xl px-2 ${pendientePicking ? 'bg-amber-50 border border-amber-200' : parcial ? 'bg-yellow-50 border border-yellow-300' : 'bg-emerald-50 border border-emerald-200'}`
          : ''
      }`}
      style={{ opacity: tachado ? 0.45 : 1 }}
    >
      {modoPicking && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCantidadChange(marcado ? 0 : cantidadPedida);
          }}
          className={claseCheckbox}
          style={{
            background: marcado ? '#22c55e' : 'white',
            borderColor: marcado ? '#22c55e' : '#d1d5db',
            boxShadow: marcado ? '0 2px 8px #22c55e44' : 'none',
          }}
          aria-label={marcado ? t('admin.orders.unmark') : t('admin.orders.markFulfilled')}
        >
          {marcado && (
            <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
              <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      )}

      <div className={claseMiniatura}>
        {item.imagen_url && !imgError ? (
          <img src={item.imagen_url} alt={item.nombre} loading="lazy" onError={() => setImgError(true)}
               className="w-full h-full object-contain" style={{ filter: tachado ? 'grayscale(1)' : 'none' }} />
        ) : (
          <Package size={esDesktop ? 14 : 20} className="text-purple-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-body font-bold leading-snug line-clamp-1 ${esDesktop ? 'text-sm' : 'text-xs'} ${tachado ? 'line-through text-admin-inactive' : 'text-admin-text'}`}>
          {item.nombre}
        </p>
        {modoPicking && (
          <span
            className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full font-body font-black ${esDesktop ? 'text-xs' : 'text-[10px]'} ${
              pendientePicking ? 'bg-amber-100 text-amber-700'
              : parcial ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {pendientePicking ? t('admin.orders.pendingToFulfill')
             : parcial ? t('admin.orders.partial', { done: cantidadSurtida, total: cantidadPedida })
             : t('admin.orders.fulfilled')}
          </span>
        )}
        {!modoPicking && tachado && (
          <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full font-body font-black ${esDesktop ? 'text-xs' : 'text-[10px]'} bg-red-100 text-red-600`}>
            {t('common.soldOut')}
          </span>
        )}
        {!modoPicking && parcial && (
          <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full font-body font-black ${esDesktop ? 'text-xs' : 'text-[10px]'} bg-amber-100 text-amber-700`}>
            {t('admin.orders.fulfilledCount', { done: cantidadSurtida, total: cantidadPedida })}
          </span>
        )}
        {hayDescuento && (
          <p className={`font-body font-bold text-emerald-600 mt-0.5 ${esDesktop ? 'text-xs' : 'text-[10px]'}`}>
            Descuento mayoreo aplicado (-{SIMBOLO_MONEDA}{ahorroTotal})
          </p>
        )}
        {esDesktop && (
          <p className="text-xs font-body text-admin-muted">
            {t('admin.orders.qtyShort')}: {cantidadSurtida !== cantidadPedida && !modoPicking ? `${cantidadSurtida} ${t('admin.orders.of')} ${cantidadPedida}` : item.cantidad}
          </p>
        )}
        {!esDesktop && item.tamano && (
          <p className="text-[11px] font-body text-admin-muted mt-0.5">{t('filters.size')}: {item.tamano}</p>
        )}
        {!esDesktop && item.familia_mayoreo && (
          <p className="text-[11px] font-body text-admin-muted">Mayoreo: {item.familia_mayoreo}</p>
        )}
        {!esDesktop && (
          <p className="text-[11px] font-body text-admin-muted">
            {t('admin.orders.quantity')}: {cantidadSurtida !== cantidadPedida && !modoPicking ? `${cantidadSurtida} ${t('admin.orders.of')} ${cantidadPedida}` : item.cantidad}
          </p>
        )}
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
              {SIMBOLO_MONEDA}{precioMostrar.toFixed(2)} c/u
            </p>
          </div>
        ) : (
          !esDesktop && <p className="text-[10px] font-body text-admin-muted">{SIMBOLO_MONEDA}{precioMostrar.toFixed(2)} c/u</p>
        )}
        {cambioPrecioMayoreo && (
          <p className="text-[10px] font-body font-bold text-amber-600 mt-0.5">
            {t('admin.orders.adjustedPrice')}
          </p>
        )}
      </div>
    </div>
    {/* +/- controls below, only when selected and quantity > 1 */}
    {modoPicking && marcado && cantidadPedida > 1 && (
      <div className={`flex items-center gap-2 ${esDesktop ? 'ml-9 mt-1 mb-1' : 'ml-10 mt-1 mb-2'}`}>
        <span className={`font-body font-bold text-admin-muted ${esDesktop ? 'text-xs' : 'text-[11px]'}`}>{t('admin.orders.fulfilledShort')}:</span>
        <button
          onClick={(e) => { e.stopPropagation(); onCantidadChange(Math.max(1, cantidadSurtida - 1)); }}
          disabled={cantidadSurtida <= 1}
          className="w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all active:scale-90 disabled:opacity-30"
          style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}
          aria-label={t('admin.orders.decreaseFulfilledQty')}
        >
          −
        </button>
        <span
          className="w-6 text-center text-sm font-body font-black tabular-nums"
          style={{ color: cantidadSurtida < cantidadPedida ? '#eab308' : '#22c55e' }}
        >
          {cantidadSurtida}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onCantidadChange(Math.min(cantidadPedida, cantidadSurtida + 1)); }}
          disabled={cantidadSurtida >= cantidadPedida}
          className="w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all active:scale-90 disabled:opacity-30"
          style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}
          aria-label={t('admin.orders.increaseFulfilledQty')}
        >
          +
        </button>
        <span className={`font-body text-admin-muted ${esDesktop ? 'text-xs' : 'text-[11px]'}`}>{t('admin.orders.of')} {cantidadPedida}</span>
      </div>
    )}
    </>
  );
}

function ListaArticulos({ items, meta, estadoPedido, pedido, onPickingListo, onTotalChange, esDesktop }) {
  const { t } = useLanguage();
  const toast = useToast();
  const modoPicking = estadoPedido === 'Armando Pedido';

  const [abierto,          setAbierto]          = useState(estadoPedido === 'Armando Pedido');
  const [articulosSurtidos, setArticulosSurtidos] = useState(() => normalizarArticulos(items, modoPicking));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setArticulosSurtidos(normalizarArticulos(items, modoPicking));
  }, [items, modoPicking, pedido?.id, pedido?.updated_at, pedido?.estado]);

  const nuevoTotal = articulosSurtidos
    .reduce((s, a) => s + (Number(a.precio_surtido ?? a.precio) || 0) * (Number(a.cantidad_surtida) || 0), 0);

  const totalOriginal  = items.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const hayFaltantes   = articulosSurtidos.some(a => (Number(a.cantidad_surtida) || 0) < Number(a.cantidad));
  const todosEncontrados = articulosSurtidos.every(a => (Number(a.cantidad_surtida) || 0) === Number(a.cantidad));

  // Propagar total al componente padre
  useEffect(() => {
    if (modoPicking && onTotalChange) onTotalChange(nuevoTotal);
  }, [nuevoTotal, modoPicking, onTotalChange]);

  function cambiarCantidadSurtida(idx, nuevaCantidad) {
    setArticulosSurtidos(prev =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        // Recalcular precio si tiene mayoreo y la cantidad baja del umbral
        const precioBase = Number(a.precio_base ?? a.precio) || 0;
        let precioAplicado = a.precio;
        if (a.precios_mayoreo) {
          precioAplicado = obtenerPrecioAplicable(
            { precio: precioBase, precios_mayoreo: a.precios_mayoreo },
            nuevaCantidad
          );
        }
        return {
          ...a,
          cantidad_surtida: nuevaCantidad,
          encontrado: nuevaCantidad > 0,
          precio_surtido: precioAplicado,
        };
      })
    );
  }

  async function pasarAListo() {
    setGuardando(true);

    // 1. Descontar el inventario automáticamente (solo lo surtido)
    try {
      const conSurtido = articulosSurtidos.filter(a => (a.cantidad_surtida || 0) > 0 && a.id);

      await Promise.all(conSurtido.map(async (art) => {
        const { data: prodData, error: errFetch } = await supabase
          .from('productos')
          .select('stock_actual, stock_ilimitado')
          .eq('id', art.id)
          .single();

        if (errFetch || !prodData || prodData.stock_ilimitado !== false) {
          return;
        }

        const stockActual = Number(prodData.stock_actual) || 0;
        let nuevoStock = stockActual - Number(art.cantidad_surtida);

        const updatePayload = {
          stock_actual: nuevoStock > 0 ? nuevoStock : 0
        };

        if (nuevoStock <= 0) {
          updatePayload.activo = false;
        }

        await supabase
          .from('productos')
          .update(updatePayload)
          .eq('id', art.id);
      }));

      // Mark products with zero fulfilled units as out of stock
      const sinSurtir = articulosSurtidos.filter(a => (a.cantidad_surtida || 0) === 0 && a.id);
      await Promise.all(sinSurtir.map(async (art) => {
        await supabase
          .from('productos')
          .update({ activo: false })
          .eq('id', art.id);
      }));
    } catch (err) {
      console.warn('[Picking] Falla parcial al actualizar inventario', err);
    }

    // 2) Update order with recalculated prices
    const articulosFinales = articulosSurtidos.map(a => ({
      ...a,
      precio: Number(a.precio_surtido ?? a.precio) || 0,
    }));
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado:        'Listo para Entrega',
        total:          nuevoTotal,
        detalles_json:  articulosFinales,
        notificado_estado: 'Listo para Entrega',
      })
      .eq('id', pedido.id);

    if (error) {
      toast.error(`${t('admin.catalog.saveError')}: ${error.message}`);
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
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150"
        style={{ background: meta.bg }}
        aria-expanded={abierto}
      >
        <span className="text-sm font-body font-black flex items-center gap-2" style={{ color: meta.color }}>
          {modoPicking ? t('admin.orders.pickingTitle') : t('admin.orders.itemList')}
          <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: meta.color, color: 'white' }}>
            {modoPicking
              ? `${articulosSurtidos.filter(a => (a.cantidad_surtida || 0) === Number(a.cantidad)).length}/${items.length}`
              : items.length}
          </span>
        </span>
        <ChevronDown size={18} style={{
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
            style={{ width: `${items.length > 0 ? (articulosSurtidos.reduce((s, a) => s + (Number(a.cantidad_surtida) || 0), 0) / items.reduce((s, a) => s + Number(a.cantidad), 0)) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Contenido */}
      {abierto && (
        <div className={`bg-admin-card animate-fade-in ${esDesktop ? 'px-4' : 'px-3'}`}>
          {modoPicking && (
            <div className="flex items-center gap-2 px-1 py-2">
              <p className="text-[11px] font-body font-bold text-amber-600 flex-1">
                {t('admin.orders.pickingHelp')}
              </p>
              <span className="text-xs font-body font-black text-admin-text whitespace-nowrap">
                {articulosSurtidos.filter(a => (a.cantidad_surtida || 0) === Number(a.cantidad)).length}/{items.length}
              </span>
            </div>
          )}
          <div>
            {/* Sort: pending first, surtidos at bottom in picking mode */}
            {(modoPicking
              ? [...articulosSurtidos.filter(a => (a.cantidad_surtida || 0) === 0), ...articulosSurtidos.filter(a => (a.cantidad_surtida || 0) > 0)]
              : articulosSurtidos
            ).map((item, _i) => {
              const originalIdx = articulosSurtidos.indexOf(item);
              return (
                <div key={originalIdx}>
                  <ItemArticulo
                    item={item}
                    modoPicking={modoPicking}
                    encontrado={item.encontrado}
                    onToggle={() => {}}
                    onCantidadChange={(nuevaCantidad) => cambiarCantidadSurtida(originalIdx, nuevaCantidad)}
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
                <span className="text-admin-muted font-bold">{t('admin.orders.originalTotal')}</span>
                <span className={`font-black ${hayFaltantes ? 'line-through text-admin-inactive' : 'text-admin-text-secondary'}`}>
                  {SIMBOLO_MONEDA}{totalOriginal.toFixed(2)}
                </span>
              </div>
              {hayFaltantes && (
                <div className="flex justify-between items-center text-xs font-body">
                  <span className="text-admin-muted font-bold">{t('admin.orders.missingItems')}</span>
                  <span className="font-black text-red-400">
                    − {SIMBOLO_MONEDA}{(totalOriginal - nuevoTotal).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-admin-border">
                <span className="text-sm font-body font-black text-admin-text">
                  {hayFaltantes ? t('admin.orders.newTotal') : t('admin.orders.totalToCharge')}
                </span>
                <span className="text-base font-body font-black text-status-done">
                  {SIMBOLO_MONEDA}{nuevoTotal.toFixed(2)}
                </span>
              </div>

              {/* Advertencia faltantes */}
              {hayFaltantes && (
                <p className="text-[11px] font-body text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 leading-snug">
                  <span aria-hidden="true">⚠️</span> {t('admin.orders.reducedQtyWarning', { count: articulosSurtidos.filter(a => (a.cantidad_surtida || 0) < Number(a.cantidad)).length })}
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
                    ? t('admin.catalog.saving')
                    : todosEncontrados
                      ? t('admin.orders.completeAndReady')
                      : t('admin.orders.savePickingAndReady')
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
  const { t } = useLanguage();
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const initials = pedido.cliente_nombre
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '??';

  // Relative timestamp
  const diffMs = Date.now() - new Date(pedido.created_at).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const timeAgo = diffMin < 1 ? t('admin.orders.now') : diffMin < 60 ? `${diffMin}m` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h` : `${Math.floor(diffMin / 1440)}d`;

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

// Single order card
function TarjetaPedido({ pedido, onCambiarEstado, actualizando, notificando, onNotificar, onPickingListo, onCancelar, esDesktop }) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha    = new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const esActualizando = actualizando === pedido.id;
  const yaNotificado = pedido.notificado_estado === pedido.estado;
  const [totalPicking, setTotalPicking] = useState(null);

  const claseHeader = esDesktop
    ? 'flex items-center justify-between gap-3 pb-4 mb-4 border-b border-admin-border-soft'
    : 'flex items-start justify-between gap-2 mb-3';

  const claseInfoCliente = esDesktop
    ? 'space-y-1.5 pb-4 mb-4 border-b border-admin-border-soft'
    : 'space-y-1 mb-3 pb-3 border-b border-admin-border';

  const claseTotal = esDesktop
    ? 'flex items-center justify-between gap-3 pb-4 border-b border-admin-border-soft'
    : 'flex items-center justify-between mb-3';

  const claseBotones = esDesktop
    ? 'flex flex-wrap items-center gap-2'
    : 'flex flex-col gap-1.5';

  const claseBotonEstado = esDesktop
    ? 'py-2.5 px-5 rounded-xl text-sm font-body font-bold whitespace-nowrap transition-all duration-200 active:scale-95 disabled:cursor-default'
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
          <span className={`font-body font-bold text-admin-text ${esDesktop ? 'text-base' : 'text-base'}`}>{pedido.folio}</span>
          {!esDesktop && <p className="text-[11px] font-body text-admin-muted mt-0.5">{fecha}</p>}
          {esDesktop && <p className="text-xs font-body text-admin-muted">{fecha}</p>}
        </div>
        <span
          className={`font-body font-bold px-3 py-1.5 rounded-full flex-shrink-0 flex items-center gap-1.5 ${meta.bgClass} ${meta.colorClass} ${esDesktop ? 'text-sm' : 'text-xs'}`}
        >
          <meta.icon size={esDesktop ? 16 : 14} strokeWidth={2.5} /> {estadoLabel(pedido.estado, t)}
        </span>
      </div>

      {/* Info cliente */}
      <div className={claseInfoCliente}>
        <p className={`font-body font-bold text-admin-text ${esDesktop ? 'text-base' : 'text-sm'}`}>{pedido.cliente_nombre}</p>
        <p className={`flex items-center gap-1.5 font-body text-admin-muted ${esDesktop ? 'text-sm' : 'text-xs'}`}><Phone size={esDesktop ? 14 : 12} /> {pedido.cliente_telefono}</p>
        <p className={`flex items-center gap-1.5 font-body text-admin-muted ${esDesktop ? 'text-sm' : 'text-xs'}`}>
          {pedido.tipo_entrega === 'envio' ? <><Truck size={esDesktop ? 14 : 12} /> {t('cart.deliveryHome')}</> : <><Store size={esDesktop ? 14 : 12} /> {t('cart.pickupStore')}</>}
        </p>
        {pedido.direccion && (
          <p className={`flex items-center gap-1.5 font-body text-admin-muted leading-relaxed ${esDesktop ? 'text-sm' : 'text-xs'}`}><MapPin size={esDesktop ? 14 : 12} className="flex-shrink-0" /> {pedido.direccion}</p>
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
          onTotalChange={setTotalPicking}
          esDesktop={esDesktop}
        />
      )}

      {/* Total */}
      <div className={claseTotal}>
        <span className={`font-body text-admin-muted font-bold ${esDesktop ? 'text-sm' : 'text-xs'}`}>{t('common.total')}</span>
        <span className={`font-body font-black ${esDesktop ? 'text-2xl' : 'text-base'} ${meta.colorClass}`}>
          {SIMBOLO_MONEDA}{(totalPicking !== null && pedido.estado === 'Armando Pedido' ? totalPicking : Number(pedido.total)).toFixed(2)}
        </span>
      </div>

      {/* Selector de estado */}
      <div className="relative mb-3">
        {esActualizando && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl bg-admin-card/80">
            <div className="w-4 h-4 rounded-full border-2 border-ink-200 border-t-ink-600 animate-spin" />
          </div>
        )}
        {/* Botón de avance al siguiente estado (oculto si picking ya lo maneja) */}
        {(() => {
          const idxActual = ESTADOS.indexOf(pedido.estado);
          const siguiente = ESTADOS[idxActual + 1];
          if (!siguiente) return null; // ya está en el último estado
          // "Armando Pedido" → "Listo para Entrega" se maneja desde el botón de picking
          if (pedido.estado === 'Armando Pedido') return null;
          const m = ESTADO_META[siguiente];
          return (
            <button
              onClick={() => onCambiarEstado(pedido.id, siguiente)}
              disabled={esActualizando}
              className={claseBotonEstado}
              style={m.activeStyle}
            >
              <span className="flex items-center justify-center gap-2">
                <m.icon size={esDesktop ? 14 : 18} strokeWidth={2.5} />
                <span>{t('admin.orders.moveTo', { status: estadoLabel(siguiente, t) })}</span>
              </span>
            </button>
          );
        })()}
      </div>

      {/* Botones de acción: notificar + cancelar */}
      <div className={`flex items-center gap-2 ${esDesktop ? 'justify-end' : 'flex-col'}`}>
        {/* Cancel order button */}
        {pedido.estado !== 'Cancelado' && (
          <button
            onClick={() => onCancelar(pedido)}
            disabled={esActualizando}
            title={t('admin.orders.cancelOrder')}
            className={`flex items-center justify-center gap-1.5 rounded-xl font-body font-bold
                       transition-all duration-200 active:scale-95 disabled:opacity-50
                       bg-red-500/10 border border-red-400/30 text-red-400
                       hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-300
                       ${esDesktop ? 'py-2 px-4 text-xs' : 'py-3 w-full text-sm order-2'}`}
          >
            <XCircle size={16} />
            {t('admin.orders.cancelOrder')}
          </button>
        )}

        {/* Cancelled order indicator */}
        {pedido.estado === 'Cancelado' && (
          <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-body font-bold
                          ${esDesktop ? '' : 'w-full order-2'}`}
               style={{ background: '#f3f4f6', color: '#6b7280' }}>
            <XCircle size={14} />
            {t('admin.orders.cancelledOrder')}
          </div>
        )}

        {/* Botón notificar por WhatsApp (oculto en "Armando Pedido", el picking notifica automáticamente) */}
        {pedido.estado !== 'Armando Pedido' && (
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
            {yaNotificado ? t('admin.orders.clientNotified') : notificando ? t('cart.sendingOrder') : t('admin.orders.notifyCustomer')}
          </button>
        )}
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
    // replaceState actualiza la URL sin disparar hashchange → evita re-render del router
    history.replaceState(null, '', v === 'catalogo' ? '#/admin/catalogo' : '#/admin');
  };

  return [vista, setVistaYHash];
}

export default function AdminPedidos({ user, onSignOut, temaOscuro, onToggleTema }) {
  const toast = useToast();
  const { t } = useLanguage();
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
    notificationPermission, requestNotificationPermission, testNotification,
  } = usePedidosAdmin({ toast, confirmCancelar });

  const notificationStatusLabel =
    notificationPermission === 'granted'
      ? t('admin.notifications.enabled')
      : notificationPermission === 'denied'
        ? t('admin.notifications.blocked')
        : notificationPermission === 'insecure'
          ? t('admin.notifications.insecure')
        : notificationPermission === 'unsupported'
          ? t('admin.notifications.unsupported')
          : t('admin.notifications.enable');

  const handleEnableNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await testNotification();
      toast.success(t('admin.notifications.enabled'));
    }
    else if (permission === 'denied') toast.warning(t('admin.notifications.blocked'));
    else if (permission === 'insecure') toast.warning(t('admin.notifications.insecure'));
    else if (permission === 'unsupported') toast.warning(t('admin.notifications.unsupported'));
  }, [requestNotificationPermission, testNotification, toast, t]);

  // Sincronizar debounce → hook
  useEffect(() => { setBusqueda(busquedaDebounced); }, [busquedaDebounced, setBusqueda]);

  // Wrapper: after status change, move active filter to new status
  const cambiarEstadoYFiltrar = useCallback(async (pedidoId, nuevoEstado) => {
    await cambiarEstado(pedidoId, nuevoEstado);
    setFiltroEstado(nuevoEstado);
  }, [cambiarEstado, setFiltroEstado]);

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
        {t('admin.skipToContent')}
      </a>

      {/* ── Sidebar Nativo (Desktop) / Header (Mobile) ── */}
      <header className="sticky top-0 z-30 border-b border-admin-border backdrop-blur-md lg:static lg:h-full lg:w-56 lg:flex-shrink-0 lg:flex lg:flex-col lg:border-b-0 lg:border-r" style={{ backgroundColor: 'var(--admin-card)' }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 lg:gap-0 lg:p-0 lg:flex-1">
          {/* ── Brand Header ── */}
          <div className="flex items-center justify-between gap-2 min-w-0 lg:flex-col lg:items-start lg:gap-0 lg:p-5 lg:pb-4 lg:overflow-hidden">
            <div className="flex items-center gap-3 min-w-0 lg:w-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center shrink-0 text-white font-display text-sm shadow-card">
                FP
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-base sm:text-lg text-admin-text leading-tight">Full Party</h1>
                <p className="text-[10px] sm:text-xs font-body text-admin-muted truncate mt-0.5 max-w-full" title={user?.email ?? ''}>
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 lg:hidden">
              <button
                type="button"
                onClick={fetchPedidos}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-bold text-admin-text-secondary hover:text-admin-text bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors disabled:opacity-50"
                title={t('admin.orders.refresh')}
                aria-label={t('admin.orders.refresh')}
                disabled={vistaAdmin !== 'pedidos'}
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="inline-flex items-center justify-center p-2 rounded-lg text-admin-muted bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
                title={notificationStatusLabel}
                aria-label={notificationStatusLabel}
              >
                <Bell size={16} />
              </button>
              <ThemeToggle isDarkMode={temaOscuro} onToggle={onToggleTema} variant="admin" />
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center p-2 rounded-lg text-admin-muted bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
                title={t('login.signOut')}
                aria-label={t('login.signOut')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* ── Nav Items (hidden on mobile — BottomNav handles it) ── */}
          <nav className="hidden lg:flex lg:flex-col lg:w-full lg:px-3 lg:gap-1" aria-label={t('admin.sections')}>
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
              {t('admin.nav.orders')}
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
              {t('admin.nav.catalog')}
            </button>
          </nav>

          {/* ── Quick Stats (Desktop only) ── */}
          <div className="hidden lg:block px-6 pt-4 mt-4 border-t border-admin-border">
            <p className="text-[10px] font-body font-bold text-admin-muted uppercase tracking-wider mb-3">{t('admin.today')}</p>
            <div className="space-y-2">
              {ESTADOS_CON_CANCELADO.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs font-body">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_META[e].color }} />
                  <span className="text-admin-muted truncate flex-1">{estadoLabel(e, t)}</span>
                  <span className="font-bold text-admin-text">{contadores[e] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar Footer (Desktop only) ── */}
          <div className="hidden lg:flex flex-col gap-3 mt-auto px-6 pt-6 pb-6 border-t border-admin-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body font-bold text-admin-muted">{t('admin.theme')}</span>
              <ThemeToggle isDarkMode={temaOscuro} onToggle={onToggleTema} variant="admin" />
            </div>
            <button
              type="button"
              onClick={fetchPedidos}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-bold text-admin-text-secondary bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
            >
              <RefreshCw size={14} />
              {t('admin.reloadData')}
            </button>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-bold text-admin-text-secondary bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
            >
              <Bell size={14} />
              {notificationStatusLabel}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-transparent transition-colors"
              title={t('login.signOut')}
            >
              <LogOut size={16} />
              {t('login.signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main id="admin-main" className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4 lg:p-5 lg:max-w-[1200px]">

        <div style={{ display: vistaAdmin === 'catalogo' ? undefined : 'none' }}>
            <h2 className="sr-only">{t('admin.catalog.title')}</h2>
            <Suspense fallback={
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-admin-border border-t-fiesta-magenta animate-spin" />
                <span className="text-sm font-body font-bold text-admin-muted">{t('admin.catalog.loading')}</span>
              </div>
            }>
              <AdminCatalogo />
            </Suspense>
        </div>

        <div style={{ display: vistaAdmin === 'pedidos' ? undefined : 'none' }}>
          <>
            <h2 className="sr-only">{t('admin.orders.management')}</h2>
        <section className="bg-admin-card rounded-2xl border border-admin-border p-4 sm:p-5 lg:p-4 space-y-3 shadow-card">
          {/* Stats: compactos en desktop, grid en móvil */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 lg:gap-2">
            {[{ key: 'todos', label: t('common.total'), icon: ClipboardList, color: '#6b35b8', bg: '#f3e8ff' },
              ...ESTADOS_CON_CANCELADO.map(e => ({ key: e, label: e, ...ESTADO_META[e] }))
            ].map(({ key, label, icon: IconComponent, color, bg }) => {
              const isActive = filtroEstado === key;
              return (
                <button
                  key={key}
                  onClick={() => setFiltroEstado(key)}
                  className={`group relative flex items-center gap-3 lg:gap-2 rounded-2xl lg:rounded-xl p-4 lg:px-3 lg:py-2.5 text-left transition-all duration-200 active:scale-[0.98] border overflow-hidden
                              ${isActive ? 'border-transparent ring-2 ring-offset-2 shadow-card-hover' : 'border-admin-border bg-admin-card hover:border-admin-border-soft text-admin-text shadow-card'}`}
                  style={isActive ? { background: color, ringColor: color, '--tw-ring-color': color } : undefined}
                >
                  {/* Accent bar */}
                  {!isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] lg:w-[2px] rounded-full" style={{ background: color }} />}
                  {/* Icon circle */}
                  <div
                    className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 lg:w-7 lg:h-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: isActive ? 'rgba(255,255,255,0.2)' : bg }}
                  >
                    <IconComponent size={16} style={{ color: isActive ? '#fff' : color }} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-body font-black text-2xl sm:text-xl lg:text-lg leading-none tabular-nums ${isActive ? 'text-white' : ''}`} role="status">
                      {contadores[key] ?? 0}
                    </p>
                    <p className={`text-[10px] sm:text-xs lg:text-[10px] font-body font-bold mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-admin-muted'}`}>
                      {key === 'todos' ? label : estadoLabel(label, t)}
                    </p>
                  </div>
                  {/* Live dot for "Por Surtir" */}
                  {key === 'Por Surtir' && (contadores[key] ?? 0) > 0 && (
                    <span className={`absolute top-2 right-2 lg:top-1.5 lg:right-1.5 w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full animate-[pulseLive_2s_ease-in-out_infinite] border-2 lg:border border-white ${isActive ? 'bg-white' : 'bg-red-500'}`} />
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
              placeholder={t('admin.orders.searchPlaceholder')}
              className="w-full bg-admin-input rounded-2xl lg:rounded-xl pl-9 pr-9 py-3 lg:py-2.5 text-sm font-body font-semibold
                         text-admin-text placeholder:text-admin-inactive outline-none border-2
                         border-admin-border focus:border-fiesta-magenta transition-colors"
            />
            {busquedaInput && (
              <button
                type="button"
                onClick={() => setBusquedaInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-inactive hover:text-admin-muted"
                aria-label={t('admin.orders.clearSearch')}
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
              {t('error.retry')}
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
                  {t('admin.orders.noActiveOrders')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4" aria-live="polite">
                  {pedidosFiltrados.map(pedido => (
                    <TarjetaPedido
                      key={pedido.id}
                      pedido={pedido}
                      onCambiarEstado={cambiarEstadoYFiltrar}
                      actualizando={actualizando}
                      notificando={notificando === pedido.id}
                      onNotificar={notificar}
                      onCancelar={cancelarPedido}
                      onPickingListo={(pedidoActualizado) => {
                        setPedidos(prev => prev.map(p =>
                          p.id === pedidoActualizado.id ? pedidoActualizado : p
                        ));
                        setFiltroEstado('Listo para Entrega');
                      }}
                      esDesktop={false}
                    />
                  ))}
                </div>

                <div className="hidden lg:grid lg:grid-cols-[340px_minmax(0,720px)] gap-4 h-[calc(100dvh-14rem)] min-h-[560px]">
                  <div className="bg-admin-card rounded-2xl border border-admin-border overflow-hidden flex flex-col shadow-card">
                    <div className="px-5 py-4 border-b border-admin-border">
                      <p className="font-body font-semibold text-sm text-admin-text">{t('admin.nav.orders')}</p>
                      <p className="text-xs font-body font-bold text-admin-muted mt-0.5">
                        {t('admin.orders.results', { count: pedidosFiltrados.length })}
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
                              <span className="text-[10px] font-body font-bold text-admin-muted uppercase tracking-wider">{estadoLabel(estado, t)}</span>
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
                    <div className="px-6 py-4 border-b border-admin-border">
                      <p className="font-body font-semibold text-base text-admin-text">{t('admin.orders.orderDetail')}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      {pedidoSeleccionado ? (
                        <TarjetaPedido
                          key={pedidoSeleccionado.id}
                          pedido={pedidoSeleccionado}
                          onCambiarEstado={cambiarEstadoYFiltrar}
                          actualizando={actualizando}
                          notificando={notificando === pedidoSeleccionado.id}
                          onNotificar={notificar}
                          onCancelar={cancelarPedido}
                          onPickingListo={(pedidoActualizado) => {
                            setPedidos(prev => prev.map(p =>
                              p.id === pedidoActualizado.id ? pedidoActualizado : p
                            ));
                            setFiltroEstado('Listo para Entrega');
                          }}
                          esDesktop={true}
                        />
                      ) : (
                        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center">
                          <ClipboardList size={40} className="text-admin-muted mb-3" />
                          <p className="font-body font-medium text-lg text-admin-muted">
                            {t('admin.orders.selectOrder')}
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
        </div>
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
