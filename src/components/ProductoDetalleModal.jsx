import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SIMBOLO_MONEDA } from '../data/productos';

export default function ProductoDetalleModal({ producto, onCerrar, onAgregar }) {
  const [cerrando, setCerrando] = useState(false);
  const closeTimerRef = useRef(null);

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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e) {
      if (e.key === 'Escape') iniciarCierre();
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [producto]);

  if (!producto) return null;

  const agotado = producto.activo === false;
  const marca = typeof producto.marca === 'string' ? producto.marca.trim() : '';
  const tamano = typeof producto.tamano === 'string' ? producto.tamano.trim() : '';

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
          cerrando ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ background: 'rgba(10, 5, 20, 0.7)', backdropFilter: 'blur(8px)' }}
        onClick={iniciarCierre}
        aria-label="Cerrar modal"
      />

      {/* Contenedor: bottom-sheet en móvil, centrado side-by-side en desktop */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-5">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${producto.nombre}`}
          className={`relative w-full sm:max-w-[480px] md:max-w-[720px] lg:max-w-[800px]
                     max-h-[94vh] sm:max-h-[88vh]
                     rounded-t-3xl sm:rounded-2xl overflow-hidden
                     shadow-2xl transition-all duration-200 ease-out
                     ${
                       cerrando
                        ? 'opacity-0 translate-y-4 scale-[0.985]'
                        : 'opacity-100 translate-y-0 scale-100'
                     }`}
          style={{
            boxShadow: '0 -8px 60px rgba(10, 5, 20, 0.5)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* Handle bar (solo en mobile) */}
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-default)' }} />
          </div>

          {/* Close button */}
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
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          {/* Layout: stacked en mobile, side-by-side en md+ */}
          <div className="md:flex md:items-stretch max-h-[94vh] sm:max-h-[88vh]">
            {/* Imagen */}
            <div
              className="w-full md:w-1/2 aspect-square sm:aspect-[4/3] md:aspect-auto md:min-h-[360px]
                         overflow-hidden flex items-center justify-center flex-shrink-0 p-6 sm:p-8"
              style={{ backgroundColor: '#ffffff' }}
            >
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-contain transition-transform duration-500 sm:hover:scale-[1.05]"
                onError={(e) => {
                  e.target.src = `https://placehold.co/900x900/f3e8ff/a855f7?text=${encodeURIComponent(producto.nombre)}`;
                }}
              />
            </div>

            {/* Contenido */}
            <div className="md:w-1/2 md:flex md:flex-col">
              <div className="px-5 pt-4 pb-5 space-y-3 overflow-y-auto flex-1
                              md:pt-5 md:px-6 md:pb-6 md:space-y-4">
                {/* Nombre y precio */}
                <div className="flex items-start justify-between gap-3 md:flex-col md:gap-1">
                  <h3 className="font-display text-lg sm:text-xl md:text-2xl leading-tight text-ink-900">
                    {producto.nombre}
                  </h3>
                  <span className="font-body font-black text-lg sm:text-xl md:text-2xl text-fiesta-magenta whitespace-nowrap shrink-0">
                    {SIMBOLO_MONEDA}{Number(producto.precio || 0).toFixed(2)}
                  </span>
                </div>

                {/* Descripción */}
                {producto.descripcion && (
                  <p className="text-sm font-body text-ink-500 leading-relaxed">{producto.descripcion}</p>
                )}

                {/* Badges de marca y tamaño */}
                {(marca || tamano) && (
                  <div className="flex flex-wrap gap-2">
                    {marca && (
                      <span className="text-xs font-body font-black px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                        {marca}
                      </span>
                    )}
                    {tamano && (
                      <span className="text-xs font-body font-black px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
                        {tamano}
                      </span>
                    )}
                  </div>
                )}

                {/* Espaciador flexible en desktop */}
                <div className="hidden md:block flex-1" />

                {/* Botón agregar */}
                <button
                  type="button"
                  onClick={() => onAgregar?.(producto)}
                  disabled={agotado}
                  className="w-full mt-1 py-3.5 rounded-2xl font-body font-black text-base text-white
                             transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: agotado
                      ? 'linear-gradient(135deg, #c4b5fd, #a78bfa)'
                      : 'linear-gradient(135deg, #ff3dac, #a855f7)',
                    boxShadow: agotado ? 'none' : '0 6px 24px #ff3dac4a',
                  }}
                >
                  {agotado ? 'No disponible' : '+ Agregar al carrito'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
