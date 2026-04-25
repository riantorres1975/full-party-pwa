import { memo, useEffect, useState } from 'react';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { getProductPlaceholderUrl, getSafeProductImageUrl } from '../../../../utils/imagenes';

function ItemArticulo({ item, modoPicking, encontrado, onToggle, onCantidadChange, onResetEstado, onConfirmarYAvanzar, fueEditado, modoGuiado, vistaResumen, guardandoPaso, esDesktop }) {
  const fallbackImage = getProductPlaceholderUrl(item.nombre, '80x80');
  const imageSrc = getSafeProductImageUrl(item.imagen_url, item.nombre, '80x80');
  const precioSurtido = Number(item.precio_surtido ?? item.precio) || 0;
  const precioAplicado = Number(item.precio) || 0;
  const cantidadPedida = Number(item.cantidad) || 1;
  const cantidadSurtida = Number(item.cantidad_surtida ?? (modoPicking ? 0 : item.cantidad)) || 0;
  const [cantidadParcial, setCantidadParcial] = useState(cantidadPedida);
  const tachado = !modoPicking && cantidadSurtida === 0 && encontrado === false;

  useEffect(() => {
    setCantidadParcial(cantidadPedida);
  }, [item?.id, item?.nombre, cantidadPedida]);

  // ── Picking mode ──────────────────────────────────────────────────────────
  if (modoPicking) {
    const esNoSurtido = cantidadSurtida === 0 && Boolean(fueEditado);
    const esPendiente = cantidadSurtida === 0 && !esNoSurtido;
    const esCompleto  = cantidadSurtida === cantidadPedida && cantidadSurtida > 0;
    const esParcial   = !esPendiente && !esNoSurtido && !esCompleto;

    if (vistaResumen) {
      const subtotalResumen = (precioSurtido * cantidadSurtida).toFixed(2);
      const estadoTexto = esPendiente ? 'Pendiente' : esNoSurtido ? 'No surtido' : esParcial ? 'Parcial' : '✓ Listo';
      const estadoStyle = esPendiente
        ? { background: '#fef3c7', color: '#92400e' }
        : esNoSurtido
          ? { background: '#fee2e2', color: '#b91c1c' }
          : esParcial
            ? { background: '#fff7ed', color: '#9a3412' }
            : { background: '#dcfce7', color: '#15803d' };

      return (
        <div className="flex items-center gap-2 py-1.5 border-b border-admin-border-soft/80 last:border-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
            <img
              src={imageSrc}
              alt={item.nombre}
              loading="lazy"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-body font-bold text-admin-text truncate leading-tight">{item.nombre}</p>
            <p className="text-[10px] font-body text-admin-muted truncate mt-0.5">
              {item.tamano ? `${item.tamano} · ` : ''}{cantidadSurtida}/{cantidadPedida} surtido
            </p>
          </div>

          <div className="w-[96px] shrink-0 text-right flex flex-col items-end">
            <span
              className="inline-flex h-5 items-center text-[10px] font-body font-black px-2 rounded-full uppercase tracking-wide"
              style={estadoStyle}
            >
              {estadoTexto}
            </span>
            <p className="text-sm font-body font-black text-admin-text mt-0.5 tabular-nums">{SIMBOLO_MONEDA}{subtotalResumen}</p>
            {esCompleto && (
              <button
                type="button"
                onClick={() => onCantidadChange(0)}
                className="text-[10px] font-body font-semibold text-gray-400 mt-0.5 hover:text-gray-500"
              >
                Deshacer
              </button>
            )}
          </div>
        </div>
      );
    }

    if (modoGuiado && !esDesktop) {
      const esCompletoSeleccionado = cantidadParcial === cantidadPedida;
      const esParcialSeleccionado = cantidadParcial > 0 && cantidadParcial < cantidadPedida;
      const esNoSurtidoSeleccionado = cantidadParcial === 0;
      const faltanUnidades = Math.max(0, cantidadPedida - cantidadParcial);

      return (
        <div className="rounded-2xl bg-white border border-admin-border-soft shadow-card p-3 mb-1">
          <div className="min-w-0 mb-2">
            <p className="font-body font-black text-base text-admin-text leading-tight line-clamp-2">{item.nombre}</p>
            {item.tamano && <p className="text-xs font-body text-admin-muted mt-0.5">{item.tamano}</p>}
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-2 mb-2 flex items-center justify-center">
            <img
              src={imageSrc}
              alt={item.nombre}
              loading="lazy"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }}
              className="w-24 h-24 object-contain"
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-2">
            <p className="text-[11px] font-body font-bold text-amber-700">Debes surtir</p>
            <p className="text-2xl font-body font-black text-amber-800 leading-none mt-0.5">{cantidadPedida} piezas</p>
          </div>

          <div className="rounded-xl border border-admin-border-soft p-2 mb-2">
            <p className="text-[11px] font-body font-bold text-admin-muted mb-1">Cantidad surtida</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCantidadParcial(prev => Math.max(0, prev - 1))}
                disabled={guardandoPaso}
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 text-2xl font-black active:scale-95"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-body font-black text-admin-text leading-none tabular-nums">{cantidadParcial}</p>
              </div>
              <button
                type="button"
                onClick={() => setCantidadParcial(prev => Math.min(cantidadPedida, prev + 1))}
                disabled={guardandoPaso}
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 text-2xl font-black active:scale-95"
              >
                +
              </button>
            </div>
            {esParcialSeleccionado && (
              <p className="text-xs font-body font-bold text-orange-600 mt-1.5 text-center">
                Faltan: {faltanUnidades}
              </p>
            )}
          </div>

          <div>
            {esCompletoSeleccionado && (
              <button
                type="button"
                onClick={() => onConfirmarYAvanzar?.(cantidadPedida)}
                disabled={guardandoPaso}
                className="w-full py-2.5 rounded-xl text-sm font-body font-black text-white disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
              >
                Confirmar completo
              </button>
            )}

            {esParcialSeleccionado && (
              <button
                type="button"
                onClick={() => onConfirmarYAvanzar?.(cantidadParcial)}
                disabled={guardandoPaso}
                className="w-full py-2.5 rounded-xl text-sm font-body font-black text-white disabled:opacity-70"
                style={{ background: '#f59e0b' }}
              >
                Confirmar parcial
              </button>
            )}

            {esNoSurtidoSeleccionado && (
              <button
                type="button"
                onClick={() => onConfirmarYAvanzar?.(0)}
                disabled={guardandoPaso}
                className="w-full py-2.5 rounded-xl text-sm font-body font-black disabled:opacity-70"
                style={{ background: '#fee2e2', color: '#b91c1c' }}
              >
                Marcar como no surtido
              </button>
            )}
          </div>
        </div>
      );
    }

    const accentColor = esPendiente ? '#fbbf24' : esNoSurtido ? '#ef4444' : esParcial ? '#f97316' : '#22c55e';
    const subtotalSurtido = (precioSurtido * cantidadSurtida).toFixed(2);

    return (
      <div
        className="rounded-xl mb-2.5 bg-white overflow-hidden"
        style={{
          borderLeft: `3px solid ${accentColor}`,
          opacity: esCompleto ? 0.72 : 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Fila: imagen + info + badge */}
        <div className="flex items-center gap-3 px-3 pt-2.5 pb-1.5">
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
            <img
              src={imageSrc}
              alt={item.nombre}
              loading="lazy"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-body font-bold text-sm text-gray-800 leading-tight truncate">{item.nombre}</p>
            {item.tamano && (
              <p className="text-[11px] font-body text-gray-400 leading-none mt-0.5">{item.tamano}</p>
            )}
          </div>

          <span
            className="text-[10px] font-body font-black px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
              style={
                esPendiente ? { background: '#fef3c7', color: '#92400e' }
                : esNoSurtido ? { background: '#fee2e2', color: '#b91c1c' }
                : esParcial  ? { background: '#fff7ed', color: '#9a3412' }
                :               { background: '#dcfce7', color: '#15803d' }
              }
            >
              {esPendiente ? 'Pendiente' : esNoSurtido ? 'No surtido' : esParcial ? 'Parcial' : '✓ Listo'}
            </span>
          </div>

        {/* Fila: stepper + acciones */}
        <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
          {cantidadPedida > 1 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); onCantidadChange(Math.max(0, cantidadSurtida - 1)); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-all text-lg select-none"
                style={{ background: '#f3f4f6', color: '#374151' }}
              >−</button>
              <div className="text-center w-10">
                <span
                  className="font-black text-base tabular-nums block leading-tight"
                  style={{ color: esPendiente ? '#9ca3af' : esParcial ? '#ea580c' : '#16a34a' }}
                >{cantidadSurtida}</span>
                <span className="text-[10px] font-body text-gray-400 leading-none">de {cantidadPedida}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onCantidadChange(Math.min(cantidadPedida, cantidadSurtida + 1)); }}
                disabled={cantidadSurtida >= cantidadPedida}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-all text-lg disabled:opacity-30 select-none"
                style={{ background: '#f3f4f6', color: '#374151' }}
              >+</button>
            </div>
          ) : (
            <p className="text-xs font-body text-gray-400">
              {cantidadPedida}× · {SIMBOLO_MONEDA}{precioAplicado.toFixed(2)}
            </p>
          )}

          <div className="flex items-center gap-1.5">
            {(esParcial || esCompleto) && (
              <button
                onClick={e => { e.stopPropagation(); onCantidadChange(0); }}
                className="text-[11px] font-body font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: '#f3f4f6', color: '#6b7280' }}
              >
                {esCompleto ? 'Deshacer' : 'No surtir'}
              </button>
            )}
            {esNoSurtido && (
              <button
                onClick={e => { e.stopPropagation(); onResetEstado?.(); }}
                className="text-[11px] font-body font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                Marcar pendiente
              </button>
            )}
            {!esCompleto && (
              <button
                onClick={e => { e.stopPropagation(); onCantidadChange(cantidadPedida); }}
                className="text-[11px] font-body font-bold px-3 py-1.5 rounded-lg text-white transition-all active:scale-95"
                style={{ background: esNoSurtido ? '#f59e0b' : '#22c55e' }}
              >
                {cantidadPedida === 1 ? '✓ Surtir' : esParcial ? 'Completar' : esNoSurtido ? 'Corregir' : 'Surtir todo'}
              </button>
            )}
            {esCompleto && (
              <span className="text-sm font-black" style={{ color: '#16a34a' }}>
                {SIMBOLO_MONEDA}{subtotalSurtido}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Vista normal (no picking) ─────────────────────────────────────────────
  const subtotal = (precioAplicado * (typeof item.cantidad_surtida === 'number' ? cantidadSurtida : cantidadPedida)).toFixed(2);
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-admin-border-soft last:border-0 transition-opacity duration-150 ${tachado ? 'opacity-50' : ''}`}>
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border-soft flex items-center justify-center">
        <img src={imageSrc} alt={item.nombre} loading="lazy" onError={e => e.currentTarget.src = fallbackImage} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-bold text-admin-text truncate">{item.nombre}</p>
        {item.tamano && <p className="text-xs font-body text-admin-muted">{item.tamano}</p>}
      </div>
      <div className="text-sm font-body font-bold shrink-0 text-right">
        <p className={tachado ? 'line-through text-admin-inactive' : 'text-admin-text'}>
          {SIMBOLO_MONEDA}{subtotal}
        </p>
      </div>
    </div>
  );
}

export default memo(ItemArticulo);
