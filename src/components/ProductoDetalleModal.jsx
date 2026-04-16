import { useEffect, useRef, useState } from 'react';
import { X, ShoppingCart, Tag, Ruler, Sparkles } from 'lucide-react';
import { SIMBOLO_MONEDA } from '../data/productos';
import { obtenerPrecioAplicable } from '../utils/precios';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';
import { getProductPlaceholderUrl, getSafeProductImageUrl, getSupabaseImageUrl } from '../utils/imagenes';

export default function ProductoDetalleModal({ producto, onCerrar, onAgregar, cantidad = 0 }) {
  const [cerrando, setCerrando] = useState(false);
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);
  const { t } = useLanguage();
  useFocusTrap(dialogRef, !!producto && !cerrando);

  const modalHeight = 'min(92dvh, 820px)';

  function iniciarCierre() {
    if (closeTimerRef.current) return;
    setCerrando(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onCerrar?.();
      setCerrando(false);
    }, 220);
  }

  useEffect(() => {
    if (!producto) return undefined;

    setCerrando(false);

    document.documentElement.classList.add('overflow-hidden');

    function onKeyDown(e) {
      if (e.key === 'Escape') iniciarCierre();
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      document.documentElement.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [producto]);

  if (!producto) return null;

  const agotado = producto.activo === false;
  const marca = typeof producto.marca === 'string' ? producto.marca.trim() : '';
  const tamano = typeof producto.tamano === 'string' ? producto.tamano.trim() : '';
  const categoria = typeof producto.categoria === 'string' ? producto.categoria.trim() : '';
  const precioBase = Number(producto.precio) || 0;
  const enCarrito = cantidad > 0;
  const precioAplicable = obtenerPrecioAplicable(producto, cantidad || 1);
  const hayDescuento = enCarrito && precioAplicable < precioBase;
  const esNuevo = producto.es_nuevo === true && !agotado;
  const fallbackImage = getProductPlaceholderUrl(producto.nombre, '900x900');
  const imageSrc = getSupabaseImageUrl(
    getSafeProductImageUrl(producto.imagen_url, producto.nombre, '900x900'),
    { width: 900, quality: 85 }
  );

  const escalasMayoreo = (() => {
    let escalas = producto.precios_mayoreo;
    if (typeof escalas === 'string') {
      try { escalas = JSON.parse(escalas); } catch { escalas = []; }
    }
    if (!Array.isArray(escalas) || escalas.length === 0) return [];
    return escalas
      .map(e => ({ min: Number(e?.cantidad_minima) || 0, precio: Number(e?.precio) }))
      .filter(e => e.min > 0 && Number.isFinite(e.precio) && e.precio < precioBase)
      .sort((a, b) => a.min - b.min);
  })();

  const stockBajo = !agotado &&
    producto.stock_ilimitado === false &&
    (producto.stock_actual || 0) > 0 &&
    (producto.stock_actual || 0) <= 5;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
          cerrando ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ background: 'rgba(10, 5, 20, 0.7)', backdropFilter: 'blur(8px)' }}
        onClick={iniciarCierre}
        aria-label={t('common.close')}
      />

      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-5">
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('product.viewDetail', { name: producto.nombre })}
          className={`relative w-full sm:max-w-[480px] md:max-w-[720px] lg:max-w-[800px]
                     h-[92dvh] sm:h-auto
                     rounded-t-3xl sm:rounded-2xl overflow-hidden
                     shadow-2xl transition-all duration-200 ease-out
                     ${
                       cerrando
                        ? 'opacity-0 translate-y-4 scale-[0.985]'
                        : 'opacity-100 translate-y-0 scale-100'
                     }`}
          style={{
            height: modalHeight,
            maxHeight: modalHeight,
            boxShadow: '0 -8px 60px rgba(10, 5, 20, 0.5)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-default)' }} />
          </div>

          <button
            type="button"
            onClick={iniciarCierre}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full
                       transition-all duration-200 hover:scale-105 active:scale-95
                       flex items-center justify-center"
            style={{
              background: 'var(--surface-card-alpha80)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            aria-label={t('common.close')}
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="flex h-full flex-col md:flex-row md:items-stretch overflow-hidden">
            <div className="relative w-full md:w-1/2 shrink md:shrink-0 md:h-full min-h-0">
              <div
                className="h-[32dvh] min-h-[180px] sm:h-[38dvh] md:h-full md:min-h-0
                           overflow-hidden flex items-center justify-center p-4 sm:p-8 relative"
                style={{ background: 'var(--surface-card)' }}
              >
                <img
                  src={imageSrc}
                  alt={producto.nombre}
                  className="w-full h-full object-contain transition-transform duration-500 sm:hover:scale-[1.05]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImage;
                  }}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 md:w-1/2 flex flex-col md:h-full">
              <div className="px-5 pt-3 pb-3 overflow-y-auto flex-1 min-h-0
                              md:pt-6 md:px-6 md:pb-6 flex flex-col">

                {(esNuevo || agotado || stockBajo || (enCarrito && !agotado)) && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {esNuevo && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-body font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
                      >
                        <Sparkles size={10} /> {t('common.new')}
                      </span>
                    )}
                    {agotado && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-body font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow-sm bg-ink-800/80">
                        {t('product.soldOut')}
                      </span>
                    )}
                    {stockBajo && (
                      <span
                        className="inline-flex items-center text-[10px] font-body font-black px-2.5 py-1 rounded-full text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}
                      >
                        {t('product.lastItemsExcl', { count: producto.stock_actual })}
                      </span>
                    )}
                    {enCarrito && !agotado && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-body font-black px-2.5 py-1 rounded-full"
                        style={{
                          background: 'rgba(168,85,247,0.12)',
                          color: '#7c3aed',
                          border: '1px solid rgba(168,85,247,0.2)',
                        }}
                      >
                        <ShoppingCart size={10} strokeWidth={2.5} /> {t('product.inCart', { count: cantidad })}
                      </span>
                    )}
                  </div>
                )}

                {categoria && (
                  <span className="self-start text-[10px] font-body font-bold uppercase tracking-wider
                                   px-2 py-0.5 rounded-md mb-2"
                        style={{ background: 'var(--border-soft)', color: 'var(--text-secondary)' }}>
                    {categoria}
                  </span>
                )}

                <h3 className="font-display text-xl sm:text-2xl md:text-[26px] leading-tight text-ink-900">
                  {producto.nombre}
                </h3>

                <div className="mt-2.5">
                  {hayDescuento ? (
                    <div className="flex items-center gap-2.5">
                      <span className="font-body font-black text-2xl sm:text-[28px]"
                            style={{ color: '#16a34a' }}>
                        {SIMBOLO_MONEDA}{precioAplicable.toFixed(2)}
                      </span>
                      <span className="text-sm text-ink-400 line-through font-body font-bold">
                        {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-body font-black px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
                        −{Math.round((1 - precioAplicable / precioBase) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="font-body font-black text-2xl sm:text-[28px] text-ink-900">
                      {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
                    </span>
                  )}
                </div>

                {producto.descripcion && (
                  <p className="text-[13px] sm:text-sm font-body leading-relaxed mt-3 line-clamp-4"
                     style={{ color: 'var(--text-secondary)' }}>
                    {producto.descripcion}
                  </p>
                )}

                {(marca || tamano) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {marca && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-body font-bold
                                       px-2.5 py-1 rounded-lg"
                            style={{
                              background: 'rgba(168,85,247,0.08)',
                              color: '#7c3aed',
                              border: '1px solid rgba(168,85,247,0.15)',
                            }}>
                        <Tag size={11} /> {marca}
                      </span>
                    )}
                    {tamano && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-body font-bold
                                       px-2.5 py-1 rounded-lg"
                            style={{
                              background: 'rgba(6,182,212,0.08)',
                              color: '#0891b2',
                              border: '1px solid rgba(6,182,212,0.15)',
                            }}>
                        <Ruler size={11} /> {tamano}
                      </span>
                    )}
                  </div>
                )}

                {escalasMayoreo.length > 0 && !agotado && (
                  <div className="mt-4 rounded-xl overflow-hidden"
                       style={{ border: '1px solid var(--border-soft)' }}>
                    <div className="px-3 py-2 flex items-center gap-1.5"
                         style={{ background: 'rgba(22,163,74,0.06)' }}>
                      <span className="text-[11px]" aria-hidden="true">🏷️</span>
                      <span className="text-[11px] font-body font-black" style={{ color: '#16a34a' }}>
                        {t('product.wholesalePrices')}
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                      {escalasMayoreo.map((e) => {
                        const ahorro = Math.round((1 - e.precio / precioBase) * 100);
                        return (
                          <div key={e.min} className="flex items-center justify-between px-3 py-2"
                               style={{ background: 'var(--surface-card)' }}>
                            <span className="text-[12px] font-body font-semibold text-ink-600">
                              {t('product.units', { count: e.min })}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-body font-black" style={{ color: '#16a34a' }}>
                                {SIMBOLO_MONEDA}{e.precio.toFixed(2)}
                              </span>
                              <span className="text-[9px] font-body font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
                                −{ahorro}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              <div className="px-5 pb-5 pt-2 md:px-6 md:pb-6 flex-shrink-0"
                   style={{ borderTop: '1px solid var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => onAgregar?.(producto)}
                  disabled={agotado}
                  className="w-full py-3.5 rounded-2xl font-body font-black text-[15px] text-white
                             transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                  style={{
                    background: agotado
                      ? 'linear-gradient(135deg, #c4b5fd, #a78bfa)'
                      : 'linear-gradient(135deg, #ff3dac, #a855f7)',
                    boxShadow: agotado ? 'none' : '0 6px 24px rgba(255,61,172,0.3)',
                  }}
                >
                  {agotado ? (
                    t('common.notAvailable')
                  ) : (
                    <>
                      <ShoppingCart size={16} strokeWidth={2.5} />
                      {enCarrito ? t('product.addAnother') : t('product.addToCart')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
