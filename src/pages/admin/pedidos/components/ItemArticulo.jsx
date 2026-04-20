import { useLanguage } from '../../../../hooks/useLanguage';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { getProductPlaceholderUrl, getSafeProductImageUrl } from '../../../../utils/imagenes';

export default function ItemArticulo({ item, modoPicking, encontrado, onToggle, onCantidadChange, esDesktop }) {
  const { t } = useLanguage();
  const fallbackImage = getProductPlaceholderUrl(item.nombre, '80x80');
  const imageSrc = getSafeProductImageUrl(item.imagen_url, item.nombre, '80x80');
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
  const cantidadParaSubtotal = modoPicking
    ? (marcado ? cantidadSurtida : cantidadPedida)
    : (typeof item.cantidad_surtida === 'number' ? cantidadSurtida : cantidadPedida);
  const subtotal = (precioMostrar * cantidadParaSubtotal).toFixed(2);

  // ── Picking mode: layout compacto con controles ──────────────────────────
  if (modoPicking) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 mb-2 border transition-all duration-150 ${
          pendientePicking ? 'bg-amber-50 border-amber-200'
          : parcial        ? 'bg-yellow-50 border-yellow-300'
          :                  'bg-emerald-50 border-emerald-200'
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onCantidadChange(marcado ? 0 : cantidadPedida); }}
          className="flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 active:scale-90"
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

        {/* Imagen */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-admin-border-soft flex items-center justify-center">
          <img src={imageSrc} alt={item.nombre} loading="lazy"
               onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }}
               className="w-full h-full object-contain" />
        </div>

        {/* Nombre + precio unitario */}
        <div className="flex-1 min-w-0">
          <p className="font-body font-bold text-sm text-admin-text leading-snug line-clamp-2">{item.nombre}</p>
          {hayDescuento && (
            <p className="text-[10px] font-body font-bold text-emerald-600">{SIMBOLO_MONEDA}{precioMostrar.toFixed(2)} c/u</p>
          )}
        </div>

        {/* Controles cantidad + subtotal */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {cantidadPedida > 1 && marcado ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onCantidadChange(Math.max(1, cantidadSurtida - 1)); }}
                disabled={cantidadSurtida <= 1}
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all active:scale-90 disabled:opacity-30"
                style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}
              >−</button>
              <span className="w-5 text-center text-xs font-black tabular-nums"
                    style={{ color: cantidadSurtida < cantidadPedida ? '#eab308' : '#22c55e' }}>
                {cantidadSurtida}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onCantidadChange(Math.min(cantidadPedida, cantidadSurtida + 1)); }}
                disabled={cantidadSurtida >= cantidadPedida}
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all active:scale-90 disabled:opacity-30"
                style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}
              >+</button>
            </div>
          ) : (
            <span className="text-xs font-body text-admin-muted">{cantidadPedida}x</span>
          )}
          <p className="text-xs font-black text-admin-text">{SIMBOLO_MONEDA}{subtotal}</p>
        </div>
      </div>
    );
  }

  // ── Vista normal (no picking) ──────────────────────────────────────────────
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-admin-border-soft last:border-0 transition-opacity duration-150 ${
      tachado ? 'opacity-50' : ''
    }`}>
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border-soft flex items-center justify-center">
        <img src={imageSrc} alt={item.nombre} loading="lazy" onError={(e) => e.currentTarget.src = fallbackImage} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-bold text-admin-text truncate">{item.nombre}</p>
        {item.tamano && <p className="text-xs font-body text-admin-muted">{item.tamano}</p>}
      </div>
      <div className="text-sm font-body font-bold shrink-0 text-right">
        <p className={`${tachado ? 'line-through text-admin-inactive' : 'text-admin-text'}`}>
          {SIMBOLO_MONEDA}{subtotal}
        </p>
      </div>
    </div>
  );
}
