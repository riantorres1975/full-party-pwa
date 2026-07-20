import { memo } from 'react';
import { SIMBOLO_MONEDA } from '../data/productos';
import { obtenerPrecioAplicable } from '../utils/precios';
import { useLanguage } from '../hooks/useLanguage';
import OptimizedImage from './OptimizedImage';
import Badge from './ui/Badge';
import Button from './ui/Button';

function ProductCardInner({
  producto,
  cantidad,
  onAgregar,
  onReducir,
  onAbrirDetalle,
  index = 0,
}) {
  const { t } = useLanguage();
  const enCarrito  = cantidad > 0;
  const agotado    = producto.activo === false;
  const maxStockAlcanzado = producto.stock_ilimitado === false && cantidad >= (producto.stock_actual || 0);
  const precioBase = Number(producto.precio) || 0;
  const precioAplicable = obtenerPrecioAplicable(producto, cantidad || 1);
  const hayDescuento = precioAplicable < precioBase;

  const stockBajo = !agotado &&
    producto.stock_ilimitado === false &&
    (producto.stock_actual || 0) > 0 &&
    (producto.stock_actual || 0) <= 5;

  const mayoreoMinTier = (() => {
    let escalas = producto.precios_mayoreo;
    if (typeof escalas === 'string') {
      try { escalas = JSON.parse(escalas); } catch { escalas = []; }
    }
    if (!Array.isArray(escalas) || escalas.length === 0) return null;
    const validas = escalas
      .map(e => ({ min: Number(e?.cantidad_minima) || 0, precio: Number(e?.precio) }))
      .filter(e => e.min > 0 && Number.isFinite(e.precio) && e.precio < precioBase)
      .sort((a, b) => a.min - b.min);
    return validas[0] || null;
  })();

  const isPriority = index < 4;
  const esNuevo = producto.es_nuevo === true && !agotado;

  return (
    <article
      className="product-card rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full"
      style={{
        background: 'var(--surface-card)',
        border: esNuevo ? '1.5px solid rgba(168,85,247,0.35)' : '1px solid var(--border-soft)',
        boxShadow: enCarrito && !agotado
          ? '0 4px 20px rgba(168, 85, 247, 0.18)'
          : undefined,
        animation: esNuevo ? 'cardNuevoGlow 3s ease-in-out infinite' : undefined,
        opacity: agotado ? 0.65 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onAbrirDetalle?.(producto)}
        className="w-full text-left cursor-pointer flex-1 flex flex-col"
      >
        <div className="relative">
          <OptimizedImage
            src={producto.imagen_url}
            alt={producto.nombre}
            priority={isPriority}
            fallbackText={producto.nombre}
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
            <div className="absolute top-2 right-2 text-[11px] font-body font-black min-w-[24px] h-6
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

        <div className="px-2 pt-2 pb-1.5 sm:px-3 sm:pt-3 sm:pb-2 flex-1 flex flex-col">
          <h3 className="font-display text-[12px] sm:text-[13px] leading-snug text-ink-900 line-clamp-2">
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="text-[11px] font-body text-ink-400 leading-snug mt-0.5 line-clamp-1 sm:line-clamp-2">
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
                <span className="text-[10px] text-ink-400 line-through font-body font-medium">
                  {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-body font-black text-[13px] sm:text-[14px] text-ink-900">
                {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
              </span>
            )}
            {mayoreoMinTier && !agotado && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px]" aria-hidden="true">🏷️</span>
                <span className="text-[10px] font-body font-bold"
                      style={{ color: 'var(--text-success)' }}>
                  {SIMBOLO_MONEDA}{mayoreoMinTier.precio.toFixed(2)} {t('product.eachUnit')}
                </span>
                <span className="text-[9px] font-body font-semibold text-ink-400">
                  {t('product.buying', { min: mayoreoMinTier.min })}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>

      <div className="px-2 pb-2 sm:px-3 sm:pb-3">
        {agotado ? (
          <Button variant="ghost" size="sm" fullWidth disabled>
            {t('common.notAvailable')}
          </Button>
        ) : enCarrito ? (
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

            <span className="font-body font-black text-sm text-ink-900 min-w-[20px] text-center">
              {cantidad}
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
