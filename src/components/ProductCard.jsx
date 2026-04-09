import { memo } from 'react';
import { SIMBOLO_MONEDA } from '../data/productos';
import { obtenerPrecioAplicable } from '../utils/precios';
import OptimizedImage from './OptimizedImage';

function ProductCardInner({
  producto,
  cantidad,
  onAgregar,
  onReducir,
  onAbrirDetalle,
  index = 0,
}) {
  const enCarrito  = cantidad > 0;
  const agotado    = producto.activo === false;
  const maxStockAlcanzado = producto.stock_ilimitado === false && cantidad >= (producto.stock_actual || 0);
  const precioBase = Number(producto.precio) || 0;
  const precioAplicable = obtenerPrecioAplicable(producto, cantidad || 1);
  const hayDescuento = precioAplicable < precioBase;

  // Badge "Últimos X" cuando stock es bajo
  const stockBajo = !agotado &&
    producto.stock_ilimitado === false &&
    (producto.stock_actual || 0) > 0 &&
    (producto.stock_actual || 0) <= 5;

  // Hint de precio mayoreo (tier mínimo)
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

  // First 4 images are above-the-fold on most screens
  const isPriority = index < 4;

  return (
    <article
      className="product-card rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-soft)',
        boxShadow: enCarrito && !agotado
          ? '0 4px 20px rgba(168, 85, 247, 0.18)'
          : '0 1px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(168,85,247,0.04)',
        opacity: agotado ? 0.65 : 1,
      }}
    >
      {/* Clickable area for detail — not a <button> to avoid nesting issues */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onAbrirDetalle?.(producto)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrirDetalle?.(producto); } }}
        className="w-full text-left cursor-pointer"
        aria-label={`Ver detalle de ${producto.nombre}`}
      >
        {/* Imagen optimizada */}
        <div className="relative">
          <OptimizedImage
            src={producto.imagen_url}
            alt={producto.nombre}
            priority={isPriority}
            fallbackText={producto.nombre}
            style={{ filter: agotado ? 'grayscale(60%)' : 'none' }}
          />

          {/* Badge agotado */}
          {agotado && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="bg-ink-900/80 text-white text-[11px] font-body font-black
                               px-3 py-1.5 rounded-full backdrop-blur-sm tracking-wide">
                <span aria-hidden="true">😔</span> Agotado
              </span>
            </div>
          )}

          {/* Badge stock bajo */}
          {stockBajo && (
            <div className="absolute bottom-2 left-2 text-[9px] font-body font-black
                            px-2 py-0.5 rounded-full text-white"
                 style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
              Últimos {producto.stock_actual}
            </div>
          )}

          {/* Badge de cantidad en carrito */}
          {enCarrito && !agotado && (
            <div className="absolute top-2 right-2 text-[11px] font-body font-black min-w-[24px] h-6
                            flex items-center justify-center px-1.5 rounded-full animate-scale-in
                            bg-white text-ink-900 shadow-md"
                 style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {cantidad}
            </div>
          )}

          {/* Badge nuevo */}
          {producto.es_nuevo === true && !agotado && (
            <div className="absolute top-2 left-2 text-[9px] font-body font-black uppercase tracking-wider
                            px-2 py-0.5 rounded-full text-white"
                 style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}>
              Nuevo
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-2 pt-2 pb-1.5 sm:px-3 sm:pt-3 sm:pb-2">
          <h2 className="font-display text-[12px] sm:text-[13px] leading-snug text-ink-900 line-clamp-2">
            {producto.nombre}
          </h2>
          {producto.descripcion && (
            <p className="text-[11px] font-body text-ink-400 leading-snug mt-0.5 line-clamp-1 sm:line-clamp-2">
              {producto.descripcion}
            </p>
          )}

          {/* Precio */}
          <div className="mt-1.5">
            {hayDescuento && enCarrito ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-ink-400 line-through font-body font-bold">
                  {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
                </span>
                <span className="font-body font-black text-[13px] sm:text-sm" style={{ color: '#16a34a' }}>
                  {SIMBOLO_MONEDA}{precioAplicable.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-body font-black text-[13px] sm:text-[14px] text-ink-900">
                {SIMBOLO_MONEDA}{precioBase.toFixed(2)}
              </span>
            )}
            {/* Hint mayoreo — siempre visible si el producto tiene tiers */}
            {mayoreoMinTier && !agotado && (
              <p className="text-[10px] font-body font-semibold mt-0.5" style={{ color: '#16a34a' }}>
                desde {SIMBOLO_MONEDA}{mayoreoMinTier.precio.toFixed(2)} × {mayoreoMinTier.min}+
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-2 pb-2 sm:px-3 sm:pb-3">
        {/* Controles */}
        {agotado ? (
          <div className="w-full py-1.5 px-3 rounded-xl text-center
                          text-[11px] font-body font-black text-ink-400
                          bg-ink-100">
            No disponible
          </div>
        ) : enCarrito ? (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => onReducir(producto.id)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl
                         bg-ink-100 text-ink-600
                         transition-all duration-150 active:scale-90 hover:bg-ink-200"
              aria-label={`Quitar uno de ${producto.nombre}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            </button>

            <span className="font-body font-black text-sm text-ink-900 min-w-[20px] text-center">
              {cantidad}
            </span>

            <button
              onClick={() => !maxStockAlcanzado && onAgregar(producto)}
              disabled={maxStockAlcanzado}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-white
                         transition-all duration-150
                         ${maxStockAlcanzado ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
              style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
              aria-label={`Agregar uno más de ${producto.nombre}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => !maxStockAlcanzado && onAgregar(producto)}
            disabled={maxStockAlcanzado}
            className={`w-full text-white text-[11px] sm:text-[12px] font-body font-black
                       py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl transition-all duration-200
                       ${maxStockAlcanzado ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            style={{
              background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
              boxShadow: maxStockAlcanzado ? 'none' : '0 2px 10px rgba(168,85,247,0.25)',
            }}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            {maxStockAlcanzado ? 'Límite máximo' : '+ Agregar'}
          </button>
        )}
      </div>
    </article>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
