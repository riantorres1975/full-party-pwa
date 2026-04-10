import { useState } from 'react';
import { categorias, marcas, tamanios } from '../data/productos';

/**
 * Mini buscador inline
 */
function BuscadorSeccion({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-2.5">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300"
           fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-2.5 py-2 text-xs font-body rounded-xl outline-none transition-all
                   border focus:border-purple-400"
        style={{
          background: 'var(--surface-input)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-soft)',
        }}
      />
    </div>
  );
}

function PillFiltro({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-xs font-body font-bold px-2.5 py-1.5 rounded-lg transition-all duration-150
                  ${activo ? 'text-white shadow-sm' : 'hover:bg-ink-100'}`}
      style={activo
        ? {
            background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
            boxShadow: '0 2px 8px #ff3dac33',
          }
        : {
            background: 'var(--surface-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-soft)',
          }}
    >
      {activo && <span className="mr-0.5">✓</span>}
      {label}
    </button>
  );
}

function FilaFiltro({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left
                 transition-all duration-150 active:scale-[0.98]
                 ${activo ? '' : 'hover:bg-ink-50'}`}
      style={activo ? { background: 'var(--surface-muted)' } : {}}
    >
      <span className={`flex-1 text-xs font-body truncate
                       ${activo ? 'font-black' : 'font-semibold'}`}
            style={{ color: activo ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span
        className={`w-[17px] h-[17px] rounded flex items-center justify-center flex-shrink-0
                   ${activo ? 'text-white' : ''}`}
        style={activo
          ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }
          : { border: '1.5px solid var(--border-default)', background: 'var(--surface-card)' }
        }
      >
        {activo && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}

function SeccionFiltro({ titulo, abiertaInicial = true, children, count, searchable = false, searchPlaceholder }) {
  const [abierta, setAbierta] = useState(abiertaInicial);
  const [busqueda, setBusqueda] = useState('');

  return (
    <div className="rounded-xl overflow-hidden"
         style={{ border: '1px solid var(--border-soft)', background: 'var(--surface-card-alpha80)' }}>
      <button
        onClick={() => setAbierta(v => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5"
      >
        <span className="text-sm font-body font-black text-ink-700 flex items-center gap-1.5">
          {titulo}
          {count > 0 && (
            <span className="text-[9px] font-body font-black bg-purple-500 text-white
                             min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
              {count}
            </span>
          )}
        </span>
        <svg
          className="w-4 h-4 text-purple-500 transition-transform duration-200"
          style={{ transform: abierta ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {abierta && (
          <div className="px-3.5 pb-3.5">
          {searchable && (
            <BuscadorSeccion
              value={busqueda}
              onChange={setBusqueda}
              placeholder={searchPlaceholder}
            />
          )}
          <div className="overflow-y-auto max-h-[190px] xl:max-h-[220px] 2xl:max-h-[260px] pr-1 custom-scrollbar">
            {typeof children === 'function' ? children(busqueda) : children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SidebarFiltrosDesktop({ filtros, toggleFiltro, limpiarFiltros, totalFiltrosActivos }) {
  return (
    <aside className="hidden lg:block sidebar-filtros-desktop">
      <div
        className="sticky top-36 rounded-2xl p-4 xl:p-5 space-y-3.5 max-h-[calc(100vh-9.5rem)] overflow-y-auto custom-scrollbar"
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-soft)',
                 boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg text-ink-900">Filtros</h3>
          <button
            onClick={limpiarFiltros}
            disabled={totalFiltrosActivos === 0}
            className="btn-limpiar-filtros px-3 py-1.5 rounded-lg text-xs font-body font-black
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-card)',
                     border: '1px solid var(--border-soft)' }}
          >
            Limpiar
          </button>
        </div>

        {/* Categorías — buscable */}
        <SeccionFiltro titulo="📁 Categoría" abiertaInicial={true}
                       count={filtros.categorias.length}
                       searchable={true} searchPlaceholder="Buscar categoría...">
          {(busqueda) => {
            const filtradas = categorias.filter(cat =>
              cat.label.toLowerCase().includes(busqueda.toLowerCase())
            );
            return (
              <div className="flex flex-col 2xl:grid 2xl:grid-cols-2 gap-0.5 2xl:gap-1">
                {filtradas.length > 0 ? filtradas.map(cat => (
                  <FilaFiltro
                    key={cat.id}
                    label={cat.label}
                    activo={filtros.categorias.includes(cat.id)}
                    onClick={() => toggleFiltro('categorias', cat.id)}
                  />
                )) : (
                  <p className="text-[11px] text-ink-300 font-body py-1 px-2">Sin coincidencias</p>
                )}
              </div>
            );
          }}
        </SeccionFiltro>

        {/* Marcas — buscable */}
        <SeccionFiltro titulo="🏷️ Marca" abiertaInicial={true}
                       count={filtros.marcas.length}
                       searchable={true} searchPlaceholder="Buscar marca...">
          {(busqueda) => {
            const filtradas = marcas.filter(m =>
              m.toLowerCase().includes(busqueda.toLowerCase())
            );
            return (
               <div className="grid grid-cols-2 2xl:grid-cols-3 gap-1.5">
                 {filtradas.length > 0 ? filtradas.map(marca => (
                   <PillFiltro
                    key={marca}
                    label={marca}
                    activo={filtros.marcas.includes(marca)}
                    onClick={() => toggleFiltro('marcas', marca)}
                  />
                )) : (
                  <p className="text-[11px] text-ink-300 font-body py-1">Sin coincidencias</p>
                )}
              </div>
            );
          }}
        </SeccionFiltro>

        {/* Tamaños */}
        <SeccionFiltro titulo="📐 Tamaño" abiertaInicial={false}
                       count={filtros.tamanios.length}>
           <div className="grid grid-cols-2 2xl:grid-cols-3 gap-1.5">
             {tamanios.map(tamano => (
              <PillFiltro
                key={tamano}
                label={tamano}
                activo={filtros.tamanios.includes(tamano)}
                onClick={() => toggleFiltro('tamanios', tamano)}
              />
            ))}
          </div>
        </SeccionFiltro>
      </div>
    </aside>
  );
}
