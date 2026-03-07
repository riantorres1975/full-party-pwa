import { useState, useEffect } from 'react';
import { categorias, marcas, tamanios } from '../data/productos';

/**
 * Sección colapsable dentro del modal
 */
function Seccion({ titulo, emoji, children, defaultOpen = true }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <div className="border-b-2 border-ink-100 last:border-0">
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5
                   font-display text-base text-ink-900 transition-colors"
      >
        <span>{emoji} {titulo}</span>
        <svg
          className="w-4 h-4 text-ink-400 transition-transform duration-300"
          style={{ transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: abierto ? '400px' : '0px', opacity: abierto ? 1 : 0 }}
      >
        <div className="px-5 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Pill seleccionable dentro del modal
 */
function PillOpcion({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 text-xs font-body font-black px-3.5 py-1.5 rounded-full
                 transition-all duration-150 active:scale-95 border-2"
      style={activo
        ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
            color: 'white', border: '2px solid transparent',
            boxShadow: '0 3px 10px #ff3dac44' }
        : { background: 'white', color: '#6b35b8', border: '2px solid #e0c4f8' }
      }
    >
      {activo && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

/**
 * ModalFiltros — Bottom sheet con 3 secciones colapsables.
 */
export default function ModalFiltros({
  isOpen, onCerrar,
  filtros, toggleFiltro, limpiarFiltros,
  totalResultados,
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const totalActivos =
    filtros.categorias.length + filtros.marcas.length + filtros.tamanios.length;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 animate-fade-in"
          style={{ background: 'rgba(26,7,51,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onCerrar}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Filtros"
        aria-modal="true"
        className={`
          fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-2xl
          flex flex-col safe-bottom
          sm:max-w-md sm:left-auto sm:right-6 sm:rounded-3xl sm:bottom-6
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-[calc(100%+2rem)]'}
        `}
        style={{ background: '#fff8fe', border: '2px solid #e0c4f8', borderTop: 'none',
                 maxHeight: '88vh' }}
      >
        {/* Franja arcoíris */}
        <div className="h-1.5 w-full flex-shrink-0"
             style={{ background: 'linear-gradient(90deg, #ff3dac, #a855f7, #00d4ff, #39e87b, #ffe135)',
                      borderRadius: '1.5rem 1.5rem 0 0' }} />

        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-ink-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink-100 flex-shrink-0">
          <div>
            <h2 className="font-display text-xl text-ink-900">🎛️ Filtros</h2>
            {totalActivos > 0 && (
              <p className="text-xs text-ink-400 font-body font-semibold">
                {totalActivos} filtro{totalActivos > 1 ? 's' : ''} activo{totalActivos > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onCerrar}
            className="p-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Secciones — scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Categorías */}
          <Seccion titulo="Categoría" emoji="🗂️" defaultOpen={true}>
            <div className="flex flex-wrap gap-2">
              {categorias.map(cat => (
                <PillOpcion
                  key={cat.id}
                  label={cat.label}
                  activo={filtros.categorias.includes(cat.id)}
                  onClick={() => toggleFiltro('categorias', cat.id)}
                />
              ))}
            </div>
          </Seccion>

          {/* Marcas */}
          <Seccion titulo="Marca" emoji="🏷️" defaultOpen={true}>
            <div className="flex flex-wrap gap-2">
              {marcas.map(marca => (
                <PillOpcion
                  key={marca}
                  label={marca}
                  activo={filtros.marcas.includes(marca)}
                  onClick={() => toggleFiltro('marcas', marca)}
                />
              ))}
            </div>
          </Seccion>

          {/* Tamaños */}
          <Seccion titulo="Tamaño" emoji="📐" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {tamanios.map(tam => (
                <PillOpcion
                  key={tam}
                  label={tam}
                  activo={filtros.tamanios.includes(tam)}
                  onClick={() => toggleFiltro('tamanios', tam)}
                />
              ))}
            </div>
          </Seccion>

        </div>

        {/* Footer fijo — botones de acción */}
        <div className="px-5 pt-3 pb-4 border-t-2 border-ink-100 flex gap-2 flex-shrink-0">
          {/* Limpiar */}
          <button
            onClick={limpiarFiltros}
            disabled={totalActivos === 0}
            className="flex-shrink-0 px-4 py-3.5 rounded-2xl font-body font-black text-sm
                       border-2 transition-all duration-200 active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: '#e0c4f8', color: '#8a56d4', background: 'white' }}
          >
            Limpiar
          </button>

          {/* Mostrar resultados */}
          <button
            onClick={onCerrar}
            className="flex-1 py-3.5 rounded-2xl font-body font-black text-base text-white
                       transition-all duration-200 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                     boxShadow: '0 4px 16px #ff3dac44' }}
          >
            Mostrar {totalResultados} resultado{totalResultados !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </>
  );
}
