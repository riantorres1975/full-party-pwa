import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { notificarCliente } from '../../../../utils/whatsapp';
import { obtenerPrecioAplicable } from '../../../../utils/precios';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import Can from '../../../../components/auth/Can';
import ItemArticulo from './ItemArticulo';
import { normalizarArticulos } from '../../../../lib/estadoMeta';

export default function ListaArticulos({ items, meta, estadoPedido, pedido, onPickingListo, onTotalChange, esDesktop }) {
  const { t } = useLanguage();
  const toast = useToast();
  const modoPicking = estadoPedido === 'Armando Pedido';
  const modoGuiadoMobile = modoPicking && !esDesktop;

  const [abierto, setAbierto] = useState(estadoPedido === 'Armando Pedido');
  const [articulosSurtidos, setArticulosSurtidos] = useState(() => normalizarArticulos(items, modoPicking));
  const [guardando, setGuardando] = useState(false);
  const [itemsEditados, setItemsEditados] = useState({});
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [feedbackGuardado, setFeedbackGuardado] = useState(false);
  const timerAutoAvanceRef = useRef(null);

  useEffect(() => {
    setArticulosSurtidos(normalizarArticulos(items, modoPicking));
    setItemsEditados({});
    setIndiceActivo(0);
    setMostrarTodos(false);
    setFeedbackGuardado(false);
  }, [items, modoPicking, pedido?.id, pedido?.updated_at, pedido?.estado]);

  useEffect(() => {
    return () => {
      if (timerAutoAvanceRef.current) {
        window.clearTimeout(timerAutoAvanceRef.current);
      }
    };
  }, []);

  const { nuevoTotal, totalOriginal, hayFaltantes, todosEncontrados, totalUnidades, surtidoUnidades, surtidosCount } = useMemo(() => {
    const totalNuevo = articulosSurtidos.reduce((s, a) => s + (Number(a.precio_surtido ?? a.precio) || 0) * (Number(a.cantidad_surtida) || 0), 0);
    const totalBase = items.reduce((s, a) => s + a.precio * a.cantidad, 0);
    const faltantes = articulosSurtidos.some(a => (Number(a.cantidad_surtida) || 0) < Number(a.cantidad));
    const completos = articulosSurtidos.every(a => (Number(a.cantidad_surtida) || 0) === Number(a.cantidad));
    const unidadesTotales = items.reduce((s, a) => s + Number(a.cantidad), 0);
    const unidadesSurtidas = articulosSurtidos.reduce((s, a) => s + (Number(a.cantidad_surtida) || 0), 0);
    const itemsCompletos = articulosSurtidos.filter(a => (Number(a.cantidad_surtida) || 0) === Number(a.cantidad)).length;
    return {
      nuevoTotal: totalNuevo,
      totalOriginal: totalBase,
      hayFaltantes: faltantes,
      todosEncontrados: completos,
      totalUnidades: unidadesTotales,
      surtidoUnidades: unidadesSurtidas,
      surtidosCount: itemsCompletos,
    };
  }, [articulosSurtidos, items]);

  useEffect(() => {
    if (modoPicking && onTotalChange) onTotalChange(nuevoTotal);
  }, [nuevoTotal, modoPicking, onTotalChange]);

  const clampCantidad = useCallback((cantidad, maximo) => {
    const numero = Number(cantidad);
    if (!Number.isFinite(numero)) return 0;
    return Math.min(Math.max(0, numero), Math.max(0, Number(maximo) || 0));
  }, []);

  const cambiarCantidadSurtida = useCallback((idx, nuevaCantidad) => {
    setItemsEditados(prev => ({ ...prev, [idx]: true }));
    setArticulosSurtidos(prev =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        const cantidadPedida = Number(a.cantidad) || 0;
        const cantidadFinal = clampCantidad(nuevaCantidad, cantidadPedida);
        const precioBase = Number(a.precio_base ?? a.precio) || 0;
        let precioAplicado = a.precio;
        if (a.precios_mayoreo) {
          precioAplicado = obtenerPrecioAplicable(
            { precio: precioBase, precios_mayoreo: a.precios_mayoreo },
            cantidadFinal
          );
        }
        return {
          ...a,
          cantidad_surtida: cantidadFinal,
          encontrado: cantidadFinal > 0,
          precio_surtido: precioAplicado,
        };
      })
    );
  }, [clampCantidad]);

  const resetearEstadoItem = useCallback((idx) => {
    setItemsEditados(prev => {
      const siguiente = { ...prev };
      delete siguiente[idx];
      return siguiente;
    });
  }, []);

  async function pasarAListo() {
    setGuardando(true);
    try {
      const conSurtido = articulosSurtidos.filter(a => (a.cantidad_surtida || 0) > 0 && a.id);
      await Promise.all(conSurtido.map(async (art) => {
        const { data: prodData } = await supabase.from('productos').select('stock_actual, stock_ilimitado').eq('id', art.id).single();
        if (!prodData || prodData.stock_ilimitado !== false) return;
        const stockActual = Number(prodData.stock_actual) || 0;
        const nuevoStock = stockActual - Number(art.cantidad_surtida);
        await supabase.from('productos').update({
          stock_actual: nuevoStock > 0 ? nuevoStock : 0,
          ...(nuevoStock <= 0 && { activo: false }),
        }).eq('id', art.id);
      }));
      const sinSurtir = articulosSurtidos.filter(a => (a.cantidad_surtida || 0) === 0 && a.id);
      await Promise.all(sinSurtir.map(async (art) => {
        await supabase.from('productos').update({ activo: false }).eq('id', art.id);
      }));
    } catch (err) {
      console.warn('[Picking] Error actualizar inventario', err);
    }

    const articulosFinales = articulosSurtidos.map(a => ({
      ...a,
      precio: Number(a.precio_surtido ?? a.precio) || 0,
    }));
    const { error } = await supabase.from('pedidos').update({
      estado: 'Listo para Entrega',
      total: nuevoTotal,
      detalles_json: articulosFinales,
      notificado_estado: 'Listo para Entrega',
    }).eq('id', pedido.id);

    if (error) {
      toast.error(`Error: ${error.message}`);
      setGuardando(false);
      return;
    }

    notificarCliente({ ...pedido, estado: 'Listo para Entrega', total: nuevoTotal }, articulosSurtidos);
    onPickingListo?.({
      ...pedido,
      estado: 'Listo para Entrega',
      total: nuevoTotal,
      detalles_json: articulosSurtidos,
      notificado_estado: 'Listo para Entrega',
    });
    setGuardando(false);
  }

  // Métricas de progreso
  const progresoPct = totalUnidades > 0 ? (surtidoUnidades / totalUnidades) * 100 : 0;

  const pendientesIndices = useMemo(
    () => articulosSurtidos.reduce((acc, a, idx) => {
      const surtida = Number(a.cantidad_surtida) || 0;
      if (surtida === 0 && !itemsEditados[idx]) acc.push(idx);
      return acc;
    }, []),
    [articulosSurtidos, itemsEditados]
  );
  const pendientesCount = pendientesIndices.length;

  const esPendienteIndice = useCallback((idx) => {
    const item = articulosSurtidos[idx];
    if (!item) return false;
    const surtida = Number(item.cantidad_surtida) || 0;
    return surtida === 0 && !itemsEditados[idx];
  }, [articulosSurtidos, itemsEditados]);

  const buscarPendienteDesde = useCallback((desde) => {
    for (let i = desde; i < articulosSurtidos.length; i += 1) {
      if (esPendienteIndice(i)) return i;
    }
    return -1;
  }, [articulosSurtidos.length, esPendienteIndice]);

  useEffect(() => {
    if (!modoGuiadoMobile || mostrarTodos || pendientesCount === 0) return;
    if (esPendienteIndice(indiceActivo)) return;

    const siguiente = buscarPendienteDesde(indiceActivo + 1);
    if (siguiente !== -1) {
      setIndiceActivo(siguiente);
      return;
    }

    const reinicio = buscarPendienteDesde(0);
    if (reinicio !== -1) setIndiceActivo(reinicio);
  }, [modoGuiadoMobile, mostrarTodos, pendientesCount, indiceActivo, articulosSurtidos, itemsEditados]);

  const confirmarYAvanzar = useCallback((idx, cantidadConfirmada) => {
    const item = articulosSurtidos[idx];
    if (!item) return;

    const cantidadPedida = Number(item.cantidad) || 0;
    const cantidadFinal = clampCantidad(cantidadConfirmada, cantidadPedida);

    cambiarCantidadSurtida(idx, cantidadFinal);

    if (!modoGuiadoMobile || mostrarTodos) return;

    const pendientesDespues = articulosSurtidos.reduce((acc, art, i) => {
      const surtida = i === idx ? cantidadFinal : (Number(art.cantidad_surtida) || 0);
      const editado = i === idx ? true : Boolean(itemsEditados[i]);
      if (surtida === 0 && !editado) acc.push(i);
      return acc;
    }, []);

    const siguiente = pendientesDespues.find(i => i > idx) ?? pendientesDespues[0] ?? idx;

    setFeedbackGuardado(true);
    if (timerAutoAvanceRef.current) {
      window.clearTimeout(timerAutoAvanceRef.current);
    }
    timerAutoAvanceRef.current = window.setTimeout(() => {
      setIndiceActivo(siguiente);
      setFeedbackGuardado(false);
      timerAutoAvanceRef.current = null;
    }, 240);
  }, [articulosSurtidos, clampCantidad, cambiarCantidadSurtida, modoGuiadoMobile, mostrarTodos, itemsEditados]);

  const renderItem = useCallback((item, idx) => {
    return (
      <ItemArticulo
        key={`${item.id || item.nombre}-${idx}`}
        item={item}
        modoPicking={modoPicking}
        encontrado={item.encontrado}
        onToggle={() => {}}
        onCantidadChange={(nuevaCantidad) => cambiarCantidadSurtida(idx, nuevaCantidad)}
        onResetEstado={() => resetearEstadoItem(idx)}
        onConfirmarYAvanzar={(cantidadConfirmada) => confirmarYAvanzar(idx, cantidadConfirmada)}
        fueEditado={Boolean(itemsEditados[idx])}
        modoGuiado={modoGuiadoMobile && !mostrarTodos}
        vistaResumen={modoGuiadoMobile && mostrarTodos}
        guardandoPaso={feedbackGuardado}
        esDesktop={esDesktop}
      />
    );
  }, [cambiarCantidadSurtida, confirmarYAvanzar, esDesktop, feedbackGuardado, itemsEditados, modoGuiadoMobile, mostrarTodos, resetearEstadoItem]);

  const itemActivo = articulosSurtidos[indiceActivo] || null;
  const procesadosCount = items.length - pendientesCount;
  const pasoActual = pendientesCount > 0 ? Math.min(procesadosCount + 1, items.length) : items.length;
  const mostrarResumenDurantePicking = !modoGuiadoMobile || mostrarTodos || pendientesCount === 0;

  return (
    <div className="mb-3 rounded-2xl overflow-hidden" style={{ border: `2px solid ${meta.bg}` }}>

      {/* Header acordeón */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150"
        style={{ background: meta.bg }}
      >
        <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-body font-black" style={{ color: meta.color }}>
              {modoPicking ? t('admin.orders.pickingTitle') : t('admin.orders.itemList')}
            </span>
          {modoPicking && pendientesCount > 0 && (
            <span className="text-[11px] font-body font-bold" style={{ color: meta.color, opacity: 0.75 }}>
              {modoGuiadoMobile && !mostrarTodos
                ? `Paso ${pasoActual} de ${items.length}`
                : `${pendientesCount} ${pendientesCount === 1 ? 'artículo pendiente' : 'artículos pendientes'}`}
            </span>
          )}
          {modoPicking && todosEncontrados && (
            <span className="text-[11px] font-body font-bold text-green-600">¡Todo surtido!</span>
          )}
        </div>
        <ChevronDown size={18} style={{
          color: meta.color,
          transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
        }} />
      </button>

      {/* Barra de progreso */}
      {modoPicking && (
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full transition-all duration-400 ease-out"
            style={{
              width: `${progresoPct}%`,
              background: progresoPct === 100 ? '#22c55e' : '#4ade80',
            }}
          />
        </div>
      )}

      {abierto && (
        <div className="bg-admin-card animate-fade-in px-3 pt-3">

          {/* Lista items */}
          <div>
            {modoGuiadoMobile && !mostrarTodos ? (
              <div className="pb-1">
                <div className="flex items-center justify-end px-1 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setMostrarTodos(true)}
                    className="text-[11px] font-body font-bold px-2 py-1 rounded-lg"
                    style={{ background: '#f3f4f6', color: '#374151' }}
                  >
                    Ver todos los productos
                  </button>
                </div>

                {feedbackGuardado && (
                  <div className="mb-1.5 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-center">
                    <span className="text-xs font-body font-black text-green-700">✓ Guardado</span>
                  </div>
                )}

                {pendientesCount > 0 && itemActivo ? (
                  renderItem(itemActivo, indiceActivo)
                ) : (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 mb-2">
                    <p className="text-sm font-body font-black text-green-700">Todo surtido correctamente</p>
                    <p className="text-xs font-body text-green-700/90 mt-1">Ya no hay productos pendientes por surtir.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {modoGuiadoMobile && (
                  <div className="flex items-center justify-between mb-1.5 rounded-lg px-2 py-1.5" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                    <div className="min-w-0 pr-2">
                      <p className="text-[11px] font-body font-black text-gray-700">Vista general del pedido</p>
                      <p className="text-[10px] font-body text-gray-500">Resumen compacto</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarTodos(false)}
                      className="text-[10px] font-body font-bold px-2 py-1 rounded-md whitespace-nowrap border"
                      style={{ background: '#ffffff', color: '#4b5563', borderColor: '#d1d5db' }}
                    >
                      Volver a modo guiado
                    </button>
                  </div>
                )}
                {articulosSurtidos.map(renderItem)}
              </div>
            )}
          </div>

          {/* Resumen + CTA */}
          {((modoPicking && mostrarResumenDurantePicking) || (estadoPedido === 'Listo para Entrega' && hayFaltantes)) && (
            <div
              className={`rounded-xl overflow-hidden mb-2.5 mt-1 ${modoGuiadoMobile ? 'sticky bottom-2 z-10' : ''}`}
              style={{ background: '#f9fafb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {/* Totales */}
              <div className="px-4 py-3 space-y-1.5">
                {hayFaltantes && (
                  <div className="flex justify-between items-center text-xs font-body">
                    <span className="text-gray-400 font-bold">{t('admin.orders.originalTotal')}</span>
                    <span className="font-bold text-gray-300 line-through">{SIMBOLO_MONEDA}{totalOriginal.toFixed(2)}</span>
                  </div>
                )}
                {hayFaltantes && (
                  <div className="flex justify-between items-center text-xs font-body">
                    <span className="text-red-400 font-bold">{t('admin.orders.missingItems')}</span>
                    <span className="font-black text-red-400">− {SIMBOLO_MONEDA}{(totalOriginal - nuevoTotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-sm font-body font-black text-gray-700">
                    {hayFaltantes ? t('admin.orders.newTotal') : t('admin.orders.totalToCharge')}
                  </span>
                  <span className="text-xl font-body font-black" style={{ color: '#16a34a' }}>
                    {SIMBOLO_MONEDA}{nuevoTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Aviso faltantes */}
              {hayFaltantes && modoPicking && mostrarResumenDurantePicking && (
                <div className="flex items-center gap-2 px-4 py-2 border-t border-orange-100" style={{ background: '#fff7ed' }}>
                  <span className="text-orange-400 flex-shrink-0 text-sm" aria-hidden="true">⚠</span>
                  <p className="text-[11px] font-body text-orange-700 leading-snug">
                    {t('admin.orders.reducedQtyWarning', {
                      count: articulosSurtidos.filter(a => (a.cantidad_surtida || 0) < Number(a.cantidad)).length,
                    })}
                  </p>
                </div>
              )}

              {/* CTA guardar picking */}
              {modoPicking && (
                <Can permission="pedidos.picking">
                  <div className="p-2.5 pt-2">
                    <button
                      onClick={pasarAListo}
                      disabled={guardando || nuevoTotal === 0}
                      className="w-full py-3 rounded-xl font-body font-black text-white text-sm
                                 flex items-center justify-center gap-2
                                 transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
                      style={{
                        background: nuevoTotal === 0
                          ? '#d1d5db'
                          : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        boxShadow: nuevoTotal === 0
                          ? 'none'
                          : '0 3px 10px rgba(34,197,94,0.28)',
                      }}
                    >
                      {guardando
                        ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        : <CheckCircle2 size={16} />
                      }
                      {guardando
                        ? t('admin.catalog.saving')
                        : 'Guardar y pasar a listo'
                      }
                    </button>
                  </div>
                </Can>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
