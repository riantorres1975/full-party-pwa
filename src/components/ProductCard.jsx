import { SIMBOLO_MONEDA } from '../data/productos';

// Cada tarjeta recibe un color de acento rotativo
const ACCENT_COLORS = [
  { border: '#ff3dac', shadow: '#ff3dac33', badge: '#ff3dac', badgeText: 'white'  },
  { border: '#a855f7', shadow: '#a855f733', badge: '#a855f7', badgeText: 'white'  },
  { border: '#00d4ff', shadow: '#00d4ff33', badge: '#00d4ff', badgeText: '#1a0733' },
  { border: '#ff7b2e', shadow: '#ff7b2e33', badge: '#ff7b2e', badgeText: 'white'  },
  { border: '#39e87b', shadow: '#39e87b33', badge: '#39e87b', badgeText: '#1a0733' },
  { border: '#ffe135', shadow: '#ffe13533', badge: '#ffe135', badgeText: '#1a0733' },
];

export default function ProductCard({
  producto,
  cantidad,
  onAgregar,
  onReducir,
  onAbrirDetalle,
  index = 0,
}) {
  const enCarrito  = cantidad > 0;
  const agotado    = producto.activo === false;
  const accent     = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <article
      className="bg-white rounded-3xl overflow-hidden transition-all duration-300"
      style={{
        border: agotado
          ? '2px solid #e0c4f8'
          : `2px solid ${enCarrito ? accent.border : '#f3e8ff'}`,
        boxShadow: agotado
          ? 'none'
          : enCarrito
            ? `0 6px 20px ${accent.shadow}`
            : '0 2px 8px #a855f715',
        opacity: agotado ? 0.7 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onAbrirDetalle?.(producto)}
        className="w-full text-left"
        aria-label={`Ver detalles de ${producto.nombre}`}
      >
        {/* Imagen */}
        <div
          className="relative h-40 overflow-hidden bg-white"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(224,196,248,0.35)' }}
        >
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-contain p-1.5 transition-transform duration-500 hover:scale-[1.04]"
            style={{ filter: agotado ? 'grayscale(60%)' : 'none' }}
            onError={(e) => {
              e.target.src = `https://placehold.co/400x300/f3e8ff/a855f7?text=${encodeURIComponent(producto.nombre)}`;
            }}
          />

          {/* Franja de color arriba */}
          {!agotado && (
            <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl"
                 style={{ background: `linear-gradient(90deg, ${accent.border}, transparent)` }} />
          )}

          {/* Badge agotado */}
          {agotado && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-ink-900/70 text-white text-xs font-body font-black
                               px-3 py-1.5 rounded-full backdrop-blur-sm tracking-wide">
                😔 Agotado
              </span>
            </div>
          )}

          {/* Badge de cantidad en carrito */}
          {enCarrito && !agotado && (
            <div className="absolute top-2.5 right-2.5 text-xs font-body font-black
                            px-2 py-1 rounded-full animate-scale-in border-2 border-white"
                 style={{ background: accent.badge, color: accent.badgeText }}>
              ×{cantidad}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 pb-2">
          <div className="mb-2">
            <h3 className="font-display text-sm leading-snug mb-1 text-ink-900">
              {producto.nombre}
            </h3>
            <p className="text-xs font-body text-ink-400 leading-relaxed line-clamp-2">
              {producto.descripcion}
            </p>
          </div>

          {/* Precio */}
          <span className="block font-body font-black text-sm"
                style={{ color: agotado ? '#b388e8' : accent.border }}>
            {SIMBOLO_MONEDA}{producto.precio.toFixed(2)}
          </span>
        </div>
      </button>

      <div className="px-3 pb-3">

        {/* Controles — ocultos si está agotado */}
        {agotado ? (
          <div className="w-full py-2 px-3 rounded-full text-center
                          text-xs font-body font-black text-ink-400
                          bg-ink-100 border-2 border-ink-200">
            No disponible
          </div>
        ) : enCarrito ? (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => onReducir(producto.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full
                         bg-ink-100 text-ink-600 border-2 border-ink-200
                         transition-all duration-150 active:scale-90 hover:border-fiesta-magenta hover:text-fiesta-magenta"
              aria-label="Quitar uno"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            </button>

            <span className="font-body font-black text-sm text-ink-900 min-w-[20px] text-center">
              {cantidad}
            </span>

            <button
              onClick={() => onAgregar(producto)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white
                         transition-all duration-150 active:scale-90 border-2 border-white"
              style={{ background: `linear-gradient(135deg, ${accent.border}, #a855f7)` }}
              aria-label="Agregar uno más"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAgregar(producto)}
            className="w-full text-white text-xs font-body font-black
                       py-2 px-3 rounded-full transition-all duration-200
                       active:scale-95 border-2 border-white"
            style={{
              background: `linear-gradient(135deg, ${accent.border}, #a855f7)`,
              boxShadow: `0 3px 10px ${accent.shadow}`,
            }}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            + Agregar
          </button>
        )}
      </div>
    </article>
  );
}
