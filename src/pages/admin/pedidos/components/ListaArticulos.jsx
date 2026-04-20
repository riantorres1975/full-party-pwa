import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { notificarCliente } from '../../../../utils/whatsapp';
import { obtenerPrecioAplicable } from '../../../../utils/precios';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import Can from '../../../../components/auth/Can';
import ItemArticulo from './ItemArticulo';
import { ESTADO_META, normalizarArticulos } from '../../../../lib/estadoMeta';

export default function ListaArticulos({ items, meta, estadoPedido, pedido, onPickingListo, onTotalChange, esDesktop }) {
  const { t } = useLanguage();
  const toast = useToast();
  const modoPicking = estadoPedido === 'Armando Pedido';

  const [abierto, setAbierto] = useState(estadoPedido === 'Armando Pedido');
  const [articulosSurtidos, setArticulosSurtidos] = useState(() => normalizarArticulos(items, modoPicking));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setArticulosSurtidos(normalizarArticulos(items, modoPicking));
  }, [items, modoPicking, pedido?.id, pedido?.updated_at, pedido?.estado]);

  const nuevoTotal = articulosSurtidos.reduce((s, a) => s + (Number(a.precio_surtido ?? a.precio) || 0) * (Number(a.cantidad_surtida) || 0), 0);
  const totalOriginal = items.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const hayFaltantes = articulosSurtidos.some(a => (Number(a.cantidad_surtida) || 0) < Number(a.cantidad));
  const todosEncontrados = articulosSurtidos.every(a => (Number(a.cantidad_surtida) || 0) === Number(a.cantidad));

  useEffect(() => {
    if (modoPicking && onTotalChange) onTotalChange(nuevoTotal);
  }, [nuevoTotal, modoPicking, onTotalChange]);

  function cambiarCantidadSurtida(idx, nuevaCantidad) {
    setArticulosSurtidos(prev =>
      prev.map((a, i) => {
        if (i !== idx) return a;
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
    try {
      const conSurtido = articulosSurtidos.filter(a => (a.cantidad_surtida || 0) > 0 && a.id);
      await Promise.all(conSurtido.map(async (art) => {
        const { data: prodData } = await supabase.from('productos').select('stock_actual, stock_ilimitado').eq('id', art.id).single();
        if (!prodData || prodData.stock_ilimitado !== false) return;
        const stockActual = Number(prodData.stock_actual) || 0;
        let nuevoStock = stockActual - Number(art.cantidad_surtida);
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

  return (
    <div className="mb-3 rounded-xl overflow-hidden" style={{ border: `2px solid ${meta.bg}` }}>
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150"
        style={{ background: meta.bg }}
      >
        <span className="text-sm font-body font-black flex items-center gap-2" style={{ color: meta.color }}>
          {modoPicking ? t('admin.orders.pickingTitle') : t('admin.orders.itemList')}
          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: meta.color, color: 'white' }}>
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

      {modoPicking && abierto && (
        <div className="h-1 bg-admin-elevated">
          <div
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${items.length > 0 ? (articulosSurtidos.reduce((s, a) => s + (Number(a.cantidad_surtida) || 0), 0) / items.reduce((s, a) => s + Number(a.cantidad), 0)) * 100 : 0}%` }}
          />
        </div>
      )}

      {abierto && (
        <div className="bg-admin-card animate-fade-in px-4">
          <div>
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
                    esDesktop={true}
                  />
                </div>
              );
            })}
          </div>

          {(modoPicking || (estadoPedido === 'Listo para Entrega' && hayFaltantes)) && (
            <div className="rounded-xl p-3 space-y-2 mx-2 mt-2 mb-2 bg-admin-elevated border-2 border-admin-border">
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

              {hayFaltantes && (
                <p className="text-[11px] font-body text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 leading-snug">
                  <span aria-hidden="true">⚠️</span> {t('admin.orders.reducedQtyWarning', { count: articulosSurtidos.filter(a => (a.cantidad_surtida || 0) < Number(a.cantidad)).length })}
                </p>
              )}

              {modoPicking && (
                <Can permission="pedidos.picking">
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
                </Can>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
