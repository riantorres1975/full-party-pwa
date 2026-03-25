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
        style={{ background: 'rgba(26, 7, 51, 0.62)', backdropFilter: 'blur(5px)' }}
        onClick={iniciarCierre}
        aria-label="Cerrar modal"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${producto.nombre}`}
          className={`relative w-full max-w-[760px] max-h-[92vh] bg-white rounded-3xl overflow-hidden
                     border-2 border-purple-100 shadow-2xl transition-all duration-200 ease-out
                     ${
                       cerrando
                        ? 'opacity-0 translate-y-4 scale-[0.985]'
                        : 'opacity-100 translate-y-0 scale-100'
                     }`}
          style={{ boxShadow: '0 30px 80px rgba(26, 7, 51, 0.38)' }}
        >
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #ff3dac, #a855f7, #00d4ff)' }}
          />

          <button
            type="button"
            onClick={iniciarCierre}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 border-2 border-purple-100
                       text-ink-500 hover:text-ink-900 transition-colors flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          <div
            className="h-56 sm:h-64 md:h-72 overflow-hidden"
            style={{ background: 'radial-gradient(circle at 50% 20%, #ffffff 0%, #f5edff 62%, #efe3ff 100%)' }}
          >
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-contain p-2 sm:p-3 transition-transform duration-500 sm:hover:scale-[1.03]"
              onError={(e) => {
                e.target.src = `https://placehold.co/900x700/f3e8ff/a855f7?text=${encodeURIComponent(producto.nombre)}`;
              }}
            />
          </div>

          <div className="px-5 pt-4 pb-5 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 18rem)' }}>
            <p className="text-[11px] font-body font-black uppercase tracking-[0.08em] text-purple-500">
              Detalle del producto
            </p>

            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl leading-tight text-ink-900">{producto.nombre}</h3>
              <span className="font-body font-black text-xl text-fiesta-magenta whitespace-nowrap">
                {SIMBOLO_MONEDA}{Number(producto.precio || 0).toFixed(2)}
              </span>
            </div>

            {producto.descripcion && (
              <p className="text-sm font-body text-ink-500 leading-relaxed">{producto.descripcion}</p>
            )}

            {(marca || tamano) && (
              <div className="flex flex-wrap gap-2">
                {marca && (
                  <span className="text-xs font-body font-black px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border-2 border-purple-100">
                    Marca: {marca}
                  </span>
                )}
                {tamano && (
                  <span className="text-xs font-body font-black px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 border-2 border-cyan-100">
                    Tamaño: {tamano}
                  </span>
                )}
              </div>
            )}

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
        </section>
      </div>
    </div>
  );
}
