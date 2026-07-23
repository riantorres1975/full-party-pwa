import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  Ruler,
  Share2,
  ShoppingCart,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { SIMBOLO_MONEDA } from '../data/productos';
import { obtenerPrecioAplicable, obtenerSiguienteEscalaMayoreo } from '../utils/precios';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';
import { getProductPlaceholderUrl, getSafeProductImageUrl, getSupabaseImageUrl } from '../utils/imagenes';
import { applyProductSeo, buildProductSeo, buildProductShareUrl } from '../utils/productSeo';

export default function ProductoDetalleModal({
  producto,
  onCerrar,
  onAgregar,
  onReducir,
  onSeleccionarRelacionado,
  relacionados = [],
  cantidad = 0,
  isFavorite = false,
  onToggleFavorite,
}) {
  const [cerrando, setCerrando] = useState(false);
  const [shareStatus, setShareStatus] = useState('idle');
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);
  const closeTimerRef = useRef(null);
  const shareTimerRef = useRef(null);
  const dialogRef = useRef(null);
  const { t } = useLanguage();
  useFocusTrap(dialogRef, !!producto && !cerrando, 'container');

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
      if (shareTimerRef.current) {
        clearTimeout(shareTimerRef.current);
        shareTimerRef.current = null;
      }
      document.documentElement.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [producto]);

  useEffect(() => {
    if (!producto) return undefined;

    setShareStatus('idle');
    setDescripcionExpandida(false);
    const productImage = getSupabaseImageUrl(
      getSafeProductImageUrl(producto.imagen_url, producto.nombre, '900x900'),
      { width: 900, quality: 85 },
    );
    const metadata = buildProductSeo(producto, {
      pageUrl: window.location.href,
      imageUrl: productImage,
    });

    return applyProductSeo(document, metadata);
  }, [producto]);

  if (!producto) return null;

  const stockActual = Number(producto.stock_actual) || 0;
  const stockLimitado = producto.stock_ilimitado === false;
  const agotado = producto.activo === false || (stockLimitado && stockActual <= 0);
  const marca = typeof producto.marca === 'string' ? producto.marca.trim() : '';
  const tamano = typeof producto.tamano === 'string' ? producto.tamano.trim() : '';
  const categoria = typeof producto.categoria === 'string' ? producto.categoria.trim() : '';
  const descripcion = typeof producto.descripcion === 'string' ? producto.descripcion.trim() : '';
  const descripcionLarga = descripcion.length > 90;
  const precioBase = Number(producto.precio) || 0;
  const enCarrito = cantidad > 0;
  const precioAplicable = obtenerPrecioAplicable(producto, cantidad || 1);
  const hayDescuento = enCarrito && precioAplicable < precioBase;
  const subtotal = precioAplicable * cantidad;
  const maxStockAlcanzado = stockLimitado && cantidad >= stockActual;
  const esNuevo = producto.es_nuevo === true && !agotado;
  const fallbackImage = getProductPlaceholderUrl(producto.nombre, '900x900');
  const imageSrc = getSupabaseImageUrl(
    getSafeProductImageUrl(producto.imagen_url, producto.nombre, '900x900'),
    { width: 900, quality: 85 }
  );
  const siguienteEscala = enCarrito
    ? obtenerSiguienteEscalaMayoreo(producto, cantidad)
    : null;

  const stockBajo = !agotado &&
    producto.stock_ilimitado === false &&
    stockActual > 0 &&
    stockActual <= 5;

  async function compartirProducto() {
    const shareData = {
      title: producto.nombre,
      text: t('product.shareText', { name: producto.nombre }),
      url: buildProductShareUrl(producto.id, window.location.href),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('shared');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareStatus('copied');
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setShareStatus('error');
    }

    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareStatus('idle'), 2200);
  }

  // JSON-LD inyectado en <head> mientras el modal está abierto
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    ...(producto.descripcion ? { description: producto.descripcion } : {}),
    image: getSupabaseImageUrl(
      getSafeProductImageUrl(producto.imagen_url, producto.nombre, '900x900'),
      { width: 900, quality: 85 }
    ),
    ...(marca ? { brand: { '@type': 'Brand', name: marca } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MXN',
      price: precioBase.toFixed(2),
      availability: agotado
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Full Party Uruapan' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
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
          tabIndex={-1}
          aria-label={t('product.viewDetail', { name: producto.nombre })}
          className={`product-detail-dialog relative w-full sm:max-w-[480px] md:max-w-[720px] lg:max-w-[800px]
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

          <div
            className="absolute top-3 right-3 z-10 flex items-center gap-2 md:left-3 md:right-auto"
            data-testid="product-detail-actions"
          >
            <button
              type="button"
              onClick={compartirProducto}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-body font-black transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--surface-card-alpha80)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-default)',
                color: shareStatus === 'error' ? '#dc2626' : 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              aria-label={t('product.share')}
            >
              {shareStatus === 'copied' || shareStatus === 'shared'
                ? <Check size={15} strokeWidth={2.5} />
                : <Share2 size={15} strokeWidth={2.5} />}
              <span className="hidden sm:inline">
                {shareStatus === 'copied' || shareStatus === 'shared'
                  ? t('product.linkCopied')
                  : shareStatus === 'error'
                    ? t('product.shareError')
                    : t('product.share')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite?.(producto, 'detail')}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--surface-card-alpha80)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isFavorite ? '#ff3dac' : 'var(--border-default)'}`,
                color: isFavorite ? '#e11d88' : 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              aria-pressed={isFavorite}
              aria-label={t(isFavorite ? 'product.removeFavorite' : 'product.addFavorite', { name: producto.nombre })}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={iniciarCierre}
              className="w-9 h-9 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
              style={{
                background: 'var(--surface-card-alpha80)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              aria-label={t('common.close')}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

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
                  width="900"
                  height="900"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
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
                  <div className="flex flex-wrap gap-1.5 mb-2.5" data-testid="product-status-badges">
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

                <div
                  className="mt-3 flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    background: agotado ? 'rgba(220, 38, 38, 0.06)' : 'rgba(22, 163, 74, 0.06)',
                    border: `1px solid ${agotado ? 'rgba(220, 38, 38, 0.16)' : 'rgba(22, 163, 74, 0.16)'}`,
                  }}
                >
                  <PackageCheck
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    style={{ color: agotado ? '#dc2626' : '#16a34a' }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[12px] font-body font-black" style={{ color: agotado ? '#dc2626' : '#15803d' }}>
                      {agotado
                        ? t('common.notAvailable')
                        : stockLimitado
                          ? t('product.stockAvailable', { count: stockActual })
                          : t('product.availableToOrder')}
                    </p>
                    {!agotado && (
                      <p className="mt-0.5 text-[10px] font-body font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {t('product.availabilityHint')}
                      </p>
                    )}
                  </div>
                </div>

                {descripcion && (
                  <div className="mt-3">
                    <p
                      id={`product-description-${producto.id}`}
                      className={`text-[13px] sm:text-sm font-body leading-relaxed ${
                        descripcionExpandida ? '' : 'line-clamp-2 sm:line-clamp-4'
                      }`}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {descripcion}
                    </p>
                    {descripcionLarga && (
                      <button
                        type="button"
                        onClick={() => setDescripcionExpandida((current) => !current)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-body font-black text-fiesta-purple sm:hidden"
                        aria-expanded={descripcionExpandida}
                        aria-controls={`product-description-${producto.id}`}
                      >
                        {descripcionExpandida ? t('product.showLess') : t('product.showMore')}
                        {descripcionExpandida
                          ? <ChevronUp size={13} aria-hidden="true" />
                          : <ChevronDown size={13} aria-hidden="true" />}
                      </button>
                    )}
                  </div>
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

                {relacionados.length > 0 && (
                  <section className="mt-4" aria-labelledby="related-products-title">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 id="related-products-title" className="text-[12px] font-body font-black text-ink-800">
                        {t('product.related')}
                      </h4>
                      <span className="text-[10px] font-body font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {categoria}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {relacionados.map((relacionado) => {
                        const relatedImage = getSupabaseImageUrl(
                          getSafeProductImageUrl(relacionado.imagen_url, relacionado.nombre, '240x240'),
                          { width: 240, quality: 75 },
                        );
                        return (
                          <button
                            key={relacionado.id}
                            type="button"
                            onClick={() => onSeleccionarRelacionado?.(relacionado)}
                            className="min-w-0 rounded-xl p-2 text-left transition-transform active:scale-95"
                            style={{ background: 'var(--surface-input)', border: '1px solid var(--border-soft)' }}
                            aria-label={t('product.viewRelated', { name: relacionado.nombre })}
                          >
                            <img
                              src={relatedImage}
                              alt=""
                              width="240"
                              height="240"
                              className="aspect-square w-full rounded-lg object-contain"
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = getProductPlaceholderUrl(relacionado.nombre, '240x240');
                              }}
                            />
                            <span className="mt-1.5 line-clamp-2 block text-[9px] font-body font-black leading-tight text-ink-800">
                              {relacionado.nombre}
                            </span>
                            <span className="mt-1 block text-[10px] font-body font-black" style={{ color: 'var(--accent-primary)' }}>
                              {SIMBOLO_MONEDA}{(Number(relacionado.precio) || 0).toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

              </div>

              <div className="px-5 pb-5 pt-2 md:px-6 md:pb-6 flex-shrink-0"
                   style={{ borderTop: '1px solid var(--border-soft)' }}>
                {agotado ? (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center rounded-2xl py-3.5 text-[15px] font-body font-black text-white opacity-60"
                    style={{ background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)' }}
                  >
                    {t('common.notAvailable')}
                  </button>
                ) : enCarrito ? (
                  <div>
                    {siguienteEscala && (
                      <p
                        className="mb-2 rounded-xl px-3 py-1.5 text-center text-[11px] font-body font-black"
                        style={{ background: 'rgba(22,163,74,0.08)', color: '#15803d' }}
                      >
                        {t('product.nextWholesaleTier', {
                          count: siguienteEscala.faltantes,
                          price: `${SIMBOLO_MONEDA}${siguienteEscala.precio.toFixed(2)}`,
                        })}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex min-h-12 items-center rounded-2xl p-1"
                        style={{ background: 'var(--surface-input)', border: '1px solid var(--border-default)' }}
                      >
                        <button
                          type="button"
                          onClick={() => onReducir?.(producto.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 active:scale-95"
                          aria-label={t('product.removeOne', { name: producto.nombre })}
                        >
                          <Minus size={17} strokeWidth={2.8} />
                        </button>
                        <span
                          className="min-w-10 text-center text-base font-body font-black text-ink-900"
                          aria-live="polite"
                          aria-label={t(
                            cantidad === 1 ? 'product.quantityInCartOne' : 'product.quantityInCart',
                            { count: cantidad },
                          )}
                        >
                          {cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAgregar?.(producto)}
                          disabled={maxStockAlcanzado}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ background: 'var(--gradient-accent)' }}
                          aria-label={t('product.addOne', { name: producto.nombre })}
                        >
                          <Plus size={17} strokeWidth={2.8} />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-[10px] font-body font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                          {t('product.cartSubtotal')}
                        </p>
                        <p className="text-xl font-body font-black text-ink-900">
                          {SIMBOLO_MONEDA}{subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAgregar?.(producto)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-body font-black text-white transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                      boxShadow: '0 6px 24px rgba(255,61,172,0.3)',
                    }}
                  >
                    <ShoppingCart size={16} strokeWidth={2.5} />
                    {t('product.addToCart')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
