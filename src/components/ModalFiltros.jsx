import { useState, useEffect, useMemo, useRef } from 'react';
import { categorias, marcas, tamanios } from '../data/productos';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';

function BuscadorSeccion({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-2">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300"
           fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 text-xs font-body rounded-lg outline-none transition-all
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

function Seccion({ titulo, emoji, children, defaultOpen = true, count, searchable = false, searchPlaceholder }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  const [busqueda, setBusqueda] = useState('');

  return (
    <div className="border-b border-ink-100 last:border-0"
         style={{ borderColor: 'var(--border-soft)' }}>
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3
                   font-display text-sm text-ink-900 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {emoji} {titulo}
          {count > 0 && (
            <span className="text-[10px] font-body font-black bg-purple-500 text-white
                             min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
              {count}
            </span>
          )}
        </span>
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
        style={{ maxHeight: abierto ? '320px' : '0px', opacity: abierto ? 1 : 0 }}
      >
        <div className="px-5 pb-3">
          {searchable && (
            <BuscadorSeccion
              value={busqueda}
              onChange={setBusqueda}
              placeholder={searchPlaceholder}
            />
          )}
          <div className="overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
            {typeof children === 'function' ? children(busqueda) : children}
          </div>
        </div>
      </div>
    </div>
  );
}

function PillOpcion({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 text-[11px] font-body font-bold px-3 py-1.5 rounded-lg
                 transition-all duration-150 active:scale-95
                 ${activo
                   ? 'text-white shadow-sm'
                   : 'hover:bg-ink-100'
                 }`}
      style={activo
        ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
            boxShadow: '0 2px 8px #ff3dac33' }
        : { background: 'var(--surface-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-soft)' }
      }
    >
      {activo && <span className="mr-0.5">✓</span>}
      {label}
    </button>
  );
}

function FilaOpcion({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
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
        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all
                   ${activo ? 'text-white' : ''}`}
        style={activo
          ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }
          : { border: '1.5px solid var(--border-default)', background: 'var(--surface-card)' }
        }
      >
        {activo && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function ModalFiltros({
  isOpen, onCerrar,
  filtros, toggleFiltro, limpiarFiltros,
  totalResultados,
}) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, isOpen);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) document.documentElement.classList.add('overflow-hidden');
    else        document.documentElement.classList.remove('overflow-hidden');
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, [isOpen]);

  const totalActivos =
    filtros.categorias.length + filtros.marcas.length + filtros.tamanios.length;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 animate-fade-in"
          style={{ background: 'rgba(10,5,20,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={onCerrar}
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-label={t('common.filters')}
        aria-modal="true"
        className={`
          fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-2xl
          flex flex-col safe-bottom
          sm:max-w-md sm:left-auto sm:right-6 sm:rounded-3xl sm:bottom-6
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-[calc(100%+2rem)]'}
        `}
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-soft)',
                 maxHeight: '88vh' }}
      >
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-default)' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
             style={{ borderColor: 'var(--border-soft)' }}>
          <div>
            <h2 className="font-display text-lg text-ink-900">{t('common.filters')}</h2>
            {totalActivos > 0 && (
              <p className="text-[11px] text-ink-400 font-body font-semibold">
                {totalActivos > 1
                  ? t('filters.activeCountPlural', { count: totalActivos })
                  : t('filters.activeCount', { count: totalActivos })}
              </p>
            )}
          </div>
          <button
            onClick={onCerrar}
            className="p-2 rounded-xl hover:bg-ink-100 text-ink-400 transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Seccion titulo={t('filters.category')} emoji="📁" defaultOpen={true}
                   count={filtros.categorias.length}
                   searchable={true} searchPlaceholder={t('filters.searchCategory')}>
            {(busqueda) => {
              const filtradas = categorias.filter(cat =>
                cat.label.toLowerCase().includes(busqueda.toLowerCase())
              );
              return (
                <div className="flex flex-col gap-0.5">
                  {filtradas.length > 0 ? filtradas.map(cat => (
                    <FilaOpcion
                      key={cat.id}
                      label={cat.label}
                      activo={filtros.categorias.includes(cat.id)}
                      onClick={() => toggleFiltro('categorias', cat.id)}
                    />
                  )) : (
                    <p className="text-xs text-ink-300 font-body py-2 px-3">{t('search.noMatches')}</p>
                  )}
                </div>
              );
            }}
          </Seccion>

          <Seccion titulo={t('filters.brand')} emoji="🏷️" defaultOpen={true}
                   count={filtros.marcas.length}
                   searchable={true} searchPlaceholder={t('filters.searchBrand')}>
            {(busqueda) => {
              const filtradas = marcas.filter(m =>
                m.toLowerCase().includes(busqueda.toLowerCase())
              );
              return (
                <div className="flex flex-wrap gap-1.5">
                  {filtradas.length > 0 ? filtradas.map(marca => (
                    <PillOpcion
                      key={marca}
                      label={marca}
                      activo={filtros.marcas.includes(marca)}
                      onClick={() => toggleFiltro('marcas', marca)}
                    />
                  )) : (
                    <p className="text-xs text-ink-300 font-body py-2">{t('search.noMatches')}</p>
                  )}
                </div>
              );
            }}
          </Seccion>

          <Seccion titulo={t('filters.size')} emoji="📐" defaultOpen={false}
                   count={filtros.tamanios.length}>
            <div className="flex flex-wrap gap-1.5">
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

        <div className="px-5 pt-3 pb-4 border-t flex gap-2 flex-shrink-0"
             style={{ borderColor: 'var(--border-soft)' }}>
          <button
            onClick={limpiarFiltros}
            disabled={totalActivos === 0}
            className="flex-shrink-0 px-4 py-3 rounded-xl font-body font-black text-sm
                       transition-all duration-200 active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-card)',
                     border: '1px solid var(--border-soft)' }}
          >
            {t('common.clean')}
          </button>

          <button
            onClick={onCerrar}
            className="flex-1 py-3 rounded-xl font-body font-black text-sm text-white
                       transition-all duration-200 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                     boxShadow: '0 4px 16px #ff3dac44' }}
          >
            {totalResultados !== 1
              ? t('filters.showResultsPlural', { count: totalResultados })
              : t('filters.showResults', { count: totalResultados })}
          </button>
        </div>
      </div>
    </>
  );
}
