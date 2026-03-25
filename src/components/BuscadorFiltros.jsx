import { categorias, marcas, tamanios } from '../data/productos';

// Mapeo dimension → label legible para las pills activas
const LABELS = {
  categorias: Object.fromEntries(categorias.map(c => [c.id, c.label])),
  marcas:     Object.fromEntries(marcas.map(m   => [m,    m])),
  tamanios:   Object.fromEntries(tamanios.map(t => [t,    t])),
};

/**
 * BuscadorFiltros — Barra de búsqueda + botón de filtros + pills de filtros activos.
 */
export default function BuscadorFiltros({
  busqueda, setBusqueda,
  filtros, toggleFiltro,
  totalFiltrosActivos, onAbrirFiltros,
}) {
  // Construir lista plana de filtros activos para las pills
  const pillsActivas = [
    ...filtros.categorias.map(v => ({ dim: 'categorias', val: v, label: LABELS.categorias[v] ?? v })),
    ...filtros.marcas.map(v     => ({ dim: 'marcas',     val: v, label: v })),
    ...filtros.tamanios.map(v   => ({ dim: 'tamanios',   val: v, label: v })),
  ];

  return (
    <div className="px-4 pt-4 pb-2 space-y-2.5 max-w-7xl mx-auto">

      {/* ── Fila: input + botón filtros ─────────────────────────────────── */}
      <div className="flex gap-2">
        {/* Input búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full bg-white rounded-2xl pl-10 pr-9 py-3
                       text-sm font-body font-semibold text-ink-900
                       placeholder:text-ink-300 outline-none transition-all duration-200"
            style={{ border: '2px solid #e0c4f8', boxShadow: '0 2px 12px #a855f720' }}
            onFocus={e => e.target.style.borderColor = '#ff3dac'}
            onBlur={e  => e.target.style.borderColor = '#e0c4f8'}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute inset-y-0 right-3 flex items-center text-ink-300 hover:text-fiesta-magenta transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Botón filtros */}
        <button
          onClick={onAbrirFiltros}
          className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center
                     rounded-2xl bg-white transition-all duration-200 active:scale-90"
          style={totalFiltrosActivos > 0
            ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                border: '2px solid transparent', boxShadow: '0 4px 14px #ff3dac44' }
            : { border: '2px solid #e0c4f8', boxShadow: '0 2px 12px #a855f720' }
          }
          aria-label="Abrir filtros"
        >
          {/* Ícono sliders inline (sin dependencia externa) */}
          <svg
            className="w-5 h-5"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style={{ color: totalFiltrosActivos > 0 ? 'white' : '#8a56d4' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5h18M3 12h18M3 19h18" />
            <circle cx="8"  cy="5"  r="2" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="10" cy="19" r="2" fill="currentColor" stroke="none" />
          </svg>

          {/* Badge de cantidad de filtros */}
          {totalFiltrosActivos > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center
                             text-[10px] font-body font-black bg-fiesta-yellow text-ink-900
                             rounded-full border-2 border-white">
              {totalFiltrosActivos}
            </span>
          )}
        </button>
      </div>

      {/* ── Pills de filtros activos ─────────────────────────────────────── */}
      {pillsActivas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pillsActivas.map(({ dim, val, label }) => (
            <button
              key={`${dim}-${val}`}
              onClick={() => toggleFiltro(dim, val)}
              className="flex items-center gap-1 text-xs font-body font-black
                         text-white px-3 py-1 rounded-full
                         transition-all duration-150 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                       boxShadow: '0 2px 8px #ff3dac33' }}
            >
              {label}
              <svg className="w-3 h-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
