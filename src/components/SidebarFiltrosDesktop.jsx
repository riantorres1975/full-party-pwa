import { useState } from 'react';
import { categorias, marcas, tamanios } from '../data/productos';

function PillFiltro({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-body font-black px-3 py-1.5 rounded-full border-2 transition-all duration-150"
      style={activo
        ? {
            background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
            color: 'white',
            borderColor: 'transparent',
            boxShadow: '0 3px 10px #ff3dac44',
          }
        : {
            background: 'white',
            color: '#6b35b8',
            borderColor: '#e0c4f8',
          }}
    >
      {label}
    </button>
  );
}

function SeccionFiltro({ titulo, abiertaInicial = true, children }) {
  const [abierta, setAbierta] = useState(abiertaInicial);

  return (
    <div className="border-2 border-purple-100 rounded-2xl bg-white/80 overflow-hidden">
      <button
        onClick={() => setAbierta(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2"
      >
        <span className="text-xs font-body font-black text-ink-700">{titulo}</span>
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
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SidebarFiltrosDesktop({ filtros, toggleFiltro, limpiarFiltros, totalFiltrosActivos }) {
  return (
    <aside className="hidden lg:block">
      <div
        className="sticky top-40 rounded-3xl border-2 p-4 space-y-4 max-h-[calc(100vh-11rem)] overflow-y-auto"
        style={{ background: '#fff8fe', borderColor: '#e0c4f8', boxShadow: '0 8px 28px #a855f718' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg text-ink-900">🎛️ Filtros</h3>
            {totalFiltrosActivos > 0 && (
              <p className="text-[11px] font-body font-bold text-ink-400 mt-0.5">
                {totalFiltrosActivos} activo{totalFiltrosActivos > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={limpiarFiltros}
            disabled={totalFiltrosActivos === 0}
            className="px-3 py-1.5 rounded-full text-[11px] font-body font-black border-2
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: '#e0c4f8', color: '#8a56d4', background: 'white' }}
          >
            Limpiar
          </button>
        </div>

        <SeccionFiltro titulo="🗂️ Categoría" abiertaInicial={true}>
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <PillFiltro
                key={cat.id}
                label={cat.label}
                activo={filtros.categorias.includes(cat.id)}
                onClick={() => toggleFiltro('categorias', cat.id)}
              />
            ))}
          </div>
        </SeccionFiltro>

        <SeccionFiltro titulo="🏷️ Marca" abiertaInicial={true}>
          <div className="flex flex-wrap gap-2">
            {marcas.map(marca => (
              <PillFiltro
                key={marca}
                label={marca}
                activo={filtros.marcas.includes(marca)}
                onClick={() => toggleFiltro('marcas', marca)}
              />
            ))}
          </div>
        </SeccionFiltro>

        <SeccionFiltro titulo="📐 Tamaño" abiertaInicial={false}>
          <div className="flex flex-wrap gap-2">
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
