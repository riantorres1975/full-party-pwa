import { categorias } from '../data/productos';

export default function Buscador({ busqueda, setBusqueda, categoriaActiva, setCategoriaActiva }) {
  return (
    <div className="px-4 pt-4 pb-2 space-y-3 max-w-7xl mx-auto">

      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar productos..."
          className="w-full bg-white rounded-2xl
                     pl-10 pr-10 py-3 text-sm font-body font-semibold text-ink-900
                     placeholder:text-ink-300 outline-none
                     transition-all duration-200"
          style={{ border: '2px solid #e0c4f8', boxShadow: '0 2px 12px #a855f720' }}
          onFocus={e => e.target.style.borderColor = '#ff3dac'}
          onBlur={e  => e.target.style.borderColor = '#e0c4f8'}
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute inset-y-0 right-3.5 flex items-center text-ink-300 hover:text-fiesta-magenta transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtros de categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={`
              flex-shrink-0 text-xs font-body font-black px-4 py-1.5 rounded-full
              transition-all duration-200 active:scale-95 whitespace-nowrap border-2
              ${categoriaActiva === cat.id
                ? 'text-white border-transparent'
                : 'bg-white border-ink-200 text-ink-500 hover:border-fiesta-magenta hover:text-fiesta-magenta'
              }
            `}
            style={categoriaActiva === cat.id
              ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)', boxShadow: '0 3px 12px #ff3dac44' }
              : {}
            }
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
