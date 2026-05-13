import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { categorias, marcas, tamanios } from '../data/productos';
import { useLanguage } from '../hooks/useLanguage';
import SearchPanel, { saveRecentSearch } from './SearchPanel';

const LABELS = {
  categorias: Object.fromEntries(categorias.map(c => [c.id, c.label])),
  marcas:     Object.fromEntries(marcas.map(m   => [m,    m])),
  tamanios:   Object.fromEntries(tamanios.map(t => [t,    t])),
};

function BuscadorFiltros({
  busqueda, setBusqueda,
  filtros, toggleFiltro,
  totalFiltrosActivos, onAbrirFiltros,
  productos = [],
  categoryStats = [],
  onSelectCategory,
}, ref) {
  const { t } = useLanguage();
  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      setPanelOpen(true);
    },
  }));

  useEffect(() => {
    if (!panelOpen) return undefined;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [panelOpen]);

  const pillsActivas = [
    ...filtros.categorias.map(v => ({ dim: 'categorias', val: v, label: LABELS.categorias[v] ?? v })),
    ...filtros.marcas.map(v     => ({ dim: 'marcas',     val: v, label: v })),
    ...filtros.tamanios.map(v   => ({ dim: 'tamanios',   val: v, label: v })),
  ];

  const ejecutarBusqueda = (term = busqueda) => {
    const clean = String(term || '').trim();
    if (!clean) return;
    saveRecentSearch(clean);
    setBusqueda(clean);
    setPanelOpen(false);
    inputRef.current?.blur();
  };

  const seleccionarCategoria = (category) => {
    setPanelOpen(false);
    onSelectCategory?.(category);
  };

  return (
    <div className="px-4 lg:px-10 pt-3 pb-2 space-y-2 max-w-[1500px] mx-auto">

      <div ref={rootRef} className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-ink-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onFocus={e => {
              setPanelOpen(true);
              e.target.style.borderColor = '#a855f7';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') ejecutarBusqueda();
              if (e.key === 'Escape') setPanelOpen(false);
            }}
            placeholder={t('search.placeholder')}
            className="w-full rounded-xl pl-10 pr-9 py-2.5 lg:py-2
                       text-sm font-body font-semibold
                       placeholder:text-ink-300 outline-none transition-all duration-200"
            style={{
              border: '1px solid var(--border-soft)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              backgroundColor: 'var(--surface-input)',
              color: 'var(--text-primary)',
            }}
            onBlur={e  => e.target.style.borderColor = 'var(--border-soft)'}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute inset-y-0 right-3 flex items-center text-ink-300 hover:text-fiesta-magenta transition-colors"
              aria-label={t('search.clear')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onAbrirFiltros}
          className="relative flex-shrink-0 h-11 flex items-center justify-center gap-1.5 px-3.5 lg:hidden
                     rounded-xl transition-all duration-200 active:scale-90"
          style={totalFiltrosActivos > 0
            ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                border: '1px solid transparent', boxShadow: '0 2px 10px #ff3dac44' }
            : { border: '1px solid var(--border-soft)', background: 'var(--surface-card)' }
          }
          aria-label={t('search.openFilters')}
        >
          <SlidersHorizontal
            className="w-4 h-4"
            style={{ color: totalFiltrosActivos > 0 ? 'white' : 'var(--text-secondary)' }}
          />
          <span
            className="text-xs font-body font-black"
            style={{ color: totalFiltrosActivos > 0 ? 'white' : 'var(--text-secondary)' }}
          >
            {t('common.filters')}
          </span>

          {totalFiltrosActivos > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center
                             text-[9px] font-body font-black bg-fiesta-yellow text-ink-900
                             rounded-full border-2 border-white px-1">
              {totalFiltrosActivos}
            </span>
          )}
        </button>

        <SearchPanel
          open={panelOpen}
          query={busqueda}
          productos={productos}
          categoryStats={categoryStats}
          onSearch={ejecutarBusqueda}
          onSelectProduct={(producto) => ejecutarBusqueda(producto.nombre)}
          onSelectCategory={seleccionarCategoria}
        />
      </div>

      {pillsActivas.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-1.5 pb-1 w-full lg:hidden">
          {pillsActivas.map(({ dim, val, label }) => (
            <button
              key={`${dim}-${val}`}
              onClick={() => toggleFiltro(dim, val)}
              className="flex items-center gap-1 text-[11px] font-body font-black
                         text-white px-2.5 py-1 rounded-lg flex-shrink-0
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

export default forwardRef(BuscadorFiltros);
