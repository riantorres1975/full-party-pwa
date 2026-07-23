import { memo } from 'react';
import { Heart } from 'lucide-react';
import { SIMBOLO_MONEDA } from '../data/productos';
import { obtenerPrecioAplicable, obtenerSiguienteEscalaMayoreo } from '../utils/precios';
import { useLanguage } from '../hooks/useLanguage';
import OptimizedImage from './OptimizedImage';
import Badge from './ui/Badge';
import Button from './ui/Button';

function getPriorityImageCount() {
  if (typeof window === 'undefined') return 2;
  if (window.innerWidth >= 1280) return 6;
  if (window.innerWidth >= 768) return 4;
  return 2;
}

function ProductCardInner({
  producto,
  cantidad,
  onAgregar,
  onReducir,
  onAbrirDetalle,
  isFavorite = false,
  onToggleFavorite,
  index = 0,
}) {
  const { t } = useLanguage();
  const enCarrito  = cantidad > 0;
  const agotado = producto.activo === false || (
    producto.stock_ilimitado === false && (Number(producto.stock_actual) || 0) <= 0
  );
  const maxStockAlcanzado = producto.stock_ilimitado === false && cantidad >= (producto.stock_actual || 0);
  const precioBase = Number(producto.precio) || 0;
  const precioAplicable = obtenerPrecioAplicable(producto, cantidad || 1);
  const hayDescuento = precioAplicable < precioBase;
  const subtotalCarrito = precioAplicable * cantidad;

  const stockBajo = !agotado &&
    producto.stock_ilimitado === false &&
    (producto.stock_actual || 0) > 0 &&
    (producto.stock_actual || 0) <= 5;
  const siguienteEscala = enCarrito
    ? obtenerSiguienteEscalaMayoreo(producto, cantidad)
    : null;

  const isPriority = index < getPriorityImageCount();
  const esNuevo = producto.es_nuevo === true && !agotado;

  return (
    <article
      className={`product-card relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full ${index >= 8 ? 'product-card-deferred' : ''}`}
      style={{
        background: 'var(--surface-card)',
        border: esNuevo ? '1.5px solid rgba(168,85,247,0.35)' : '1px solid var(--border-soft)',
        boxShadow: enCarrito && !agotado
          ? '0 4px 20px rgba(168, 85, 247, 0.18)'
          : undefined,
        animation: esNuevo ? 'cardNuevoGlow 3s ease-in-out infinite' : undefined,
      }}
    >
      <button
        type="button"
        onClick={() => onAbrirDetalle?.(producto)}
        className="product-card-detail-trigger w-full text-left cursor-pointer flex-1 flex flex-col focus-visible:bg-purple-50/30"
      >
        <div className="relative">
          <OptimizedImage
            src={producto.imagen_url}
            alt={producto.nombre}
            priority={isPriority}
            fallbackText={producto.nombre}
            aspectClass="aspect-square lg:aspect-[4/3]"
            style={{ filter: agotado ? 'grayscale(60%)' : 'none' }}
          />

          {agotado && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Badge variant="soldOut" size="md">{t('product.soldOut')}</Badge>
            </div>
          )}

          {stockBajo && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="warning" size="sm">{t('product.lastItems', { count: producto.stock_actual })}</Badge>
            </div>
          )}

          {enCarrito && !agotado && (
            <div className="absolute top-2 right-12 text-[11px] font-body font-black min-w-[24px] h-6
                            flex items-center justify-center px-1.5 rounded-full animate-scale-in
                            bg-white text-ink-900 shadow-md"
                 style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {cantidad}
            </div>
          )}

          {esNuevo && (
            <div className="absolute top-2 left-2">
              <Badge variant="new" size="sm" pulse>{t('common.new')}</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-2 pt-2 pb-1.5 sm:px-3 sm:pt-3 sm:pb-2 lg:pt-2 lg:pb-1.5">
          <h3 className="font-display text-[12px] sm:text-[13px] leading-snug text-ink-900 line-clamp-2">
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="mt-0.5 line-clamp-1 text-[11px] font-body leading-snug text-ink-500 sm:line-clamp-2 lg:line-clamp-1">
              {producto.descripcion}
            </p>
          )}

          <div className="mt-auto pt-1.5">
            {hayDescuento && enCarrito ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-body font-black text-[15px] sm:text-base"
                        style={{ color: 'var(--text-success)' }}>
                    {SIMBOLO_MONEDA}{precioAplicable.toFixed(2)}
                  </span>
                  <Badge variant="discount" size="sm">−{Math.round((1 - precioAplicable / precioBase) * 100)}%</Badge>
                </div>
                <span className="text-[10px] text-ink-500 line-through font-body font-medium">
                  {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-body font-black text-[13px] sm:text-[14px] text-ink-900">
                {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite?.(producto, 'card')}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-white/95 shadow-sm transition-transform hover:scale-105 active:scale-90 focus-visible:ring-2"
        style={{
          borderColor: isFavorite ? '#ff3dac' : 'var(--border-soft)',
          color: isFavorite ? '#e11d88' : '#6b4d86',
        }}
        aria-pressed={isFavorite}
        aria-label={t(isFavorite ? 'product.removeFavorite' : 'product.addFavorite', { name: producto.nombre })}
      >
        <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <div className="px-2 pb-2 sm:px-3 sm:pb-3 lg:pb-2.5">
        {agotado ? (
          <Button variant="ghost" size="sm" fullWidth disabled>
            {t('common.notAvailable')}
          </Button>
        ) : enCarrito ? (
          <div className="space-y-1.5">
            {siguienteEscala && (
              <p
                className="rounded-lg px-2 py-1 text-center text-[9px] font-body font-black leading-tight"
                style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--text-success)' }}
              >
                {t('product.nextTier', {
                  count: siguienteEscala.faltantes,
                  price: `${SIMBOLO_MONEDA}${siguienteEscala.precio.toFixed(2)}`,
                })}
              </p>
            )}

            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => onReducir(producto.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl
                           bg-ink-100 text-ink-600
                           transition-all duration-150 active:scale-90 hover:bg-ink-200"
                aria-label={t('product.removeOne', { name: producto.nombre })}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>

              <span
                className="flex min-w-[52px] flex-col items-center text-center font-body"
                aria-live="polite"
                aria-label={t('product.quantitySubtotal', {
                  count: cantidad,
                  total: `${SIMBOLO_MONEDA}${subtotalCarrito.toFixed(2)}`,
                })}
              >
                <strong className="text-sm font-black text-ink-900">{cantidad}</strong>
                <span className="text-[9px] font-black" style={{ color: 'var(--text-secondary)' }}>
                  {SIMBOLO_MONEDA}{subtotalCarrito.toFixed(2)}
                </span>
              </span>

              <button
                type="button"
                onClick={() => !maxStockAlcanzado && onAgregar(producto)}
                disabled={maxStockAlcanzado}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-white
                           transition-all duration-150
                           ${maxStockAlcanzado ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
                aria-label={t('product.addOne', { name: producto.nombre })}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            disabled={maxStockAlcanzado}
            onClick={() => !maxStockAlcanzado && onAgregar(producto)}
            aria-label={t('product.addAriaLabel', { name: producto.nombre })}
          >
            {maxStockAlcanzado ? t('product.maxLimit') : t('product.add')}
          </Button>
        )}
      </div>
    </article>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
