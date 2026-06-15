import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Check, Search } from 'lucide-react';
import { categorias, marcas, tamanios } from '../data/productos';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';

const PRODUCTOS_CACHE_KEY = 'fp_productos_cache_v1';
const BRAND_PURPLE = '#7B2FBE';

function readProductosCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCTOS_CACHE_KEY) || '{}');
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch {
    return [];
  }
}

function BuscadorSeccion({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs font-body outline-none transition-all focus:border-purple-400"
        style={{
          background: 'var(--surface-input)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-soft)',
        }}
      />
    </div>
  );
}

function Seccion({ titulo, children, searchable = false, searchPlaceholder, searchCount }) {
  const [busqueda, setBusqueda] = useState('');

  return (
    <section className="border-b px-5 py-4 last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
      <h3 className="mb-2.5 text-xs font-body font-black uppercase tracking-wide text-ink-400">
          {titulo}
      </h3>

      {searchable && (
        <BuscadorSeccion
          value={busqueda}
          onChange={setBusqueda}
          placeholder={searchPlaceholder || `Buscar entre ${searchCount || 0} categorias...`}
        />
      )}

      <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {typeof children === 'function' ? children(busqueda) : children}
      </div>
    </section>
  );
}

function PillOpcion({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-full px-4 py-2 text-xs font-body font-black transition-all duration-150 active:scale-95"
      style={activo
        ? {
            background: BRAND_PURPLE,
            color: 'white',
            border: '1px solid transparent',
            boxShadow: '0 2px 8px rgba(123,47,190,0.22)',
          }
        : {
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            border: '1px solid #e5e7eb',
          }}
    >
      {label}
    </button>
  );
}

function FilaCategoria({ label, activo, count = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={activo}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-all duration-150 active:scale-[0.98]"
      style={activo
        ? {
            background: 'rgba(123,47,190,0.12)',
            border: '1px solid rgba(123,47,190,0.32)',
          }
        : {
            background: 'var(--surface-card)',
            border: '1px solid var(--border-soft)',
          }}
    >
      <span
        aria-hidden="true"
        className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-md transition-all"
        style={activo
          ? { background: BRAND_PURPLE, border: `1px solid ${BRAND_PURPLE}` }
          : { background: 'var(--surface-input)', border: '1.5px solid var(--border-default)' }}
      >
        {activo && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-sm font-body font-black"
        style={{ color: activo ? BRAND_PURPLE : 'var(--text-primary)' }}
      >
        {label}
      </span>
      <span
        className="flex h-5 min-w-[26px] flex-shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-body font-bold tabular-nums transition-all"
        style={activo
          ? { background: 'rgba(123,47,190,0.14)', color: BRAND_PURPLE }
          : { background: '#f3f4f6', color: '#6b7280' }}
      >
        {count}
      </span>
    </button>
  );
}

function PrecioInputs({ min, max, valueMin, valueMax, onChange }) {
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  useEffect(() => {
    const nextMin = Number.isFinite(valueMin) ? valueMin : min;
    const nextMax = Number.isFinite(valueMax) ? valueMax : max;
    setMinValue(Number.isFinite(nextMin) ? String(nextMin) : '');
    setMaxValue(Number.isFinite(nextMax) ? String(nextMax) : '');
  }, [min, max, valueMin, valueMax]);

  const commitChange = (nextMinText, nextMaxText) => {
    let nextMin = nextMinText === '' ? null : Number(nextMinText);
    let nextMax = nextMaxText === '' ? null : Number(nextMaxText);

    if (!Number.isFinite(nextMin)) nextMin = null;
    if (!Number.isFinite(nextMax)) nextMax = null;

    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      nextMin = nextMax;
      setMinValue(String(nextMin));
    }

    onChange?.({
      min: nextMin === min ? null : nextMin,
      max: nextMax === max ? null : nextMax,
    });
  };

  const handleMinChange = (event) => {
    const nextText = event.target.value;
    setMinValue(nextText);
    commitChange(nextText, maxValue);
  };

  const handleMaxChange = (event) => {
    const nextText = event.target.value;
    let nextMax = nextText === '' ? null : Number(nextText);
    const currentMin = minValue === '' ? null : Number(minValue);

    if (Number.isFinite(nextMax) && Number.isFinite(currentMin) && nextMax < currentMin) {
      nextMax = currentMin;
      setMaxValue(String(nextMax));
      commitChange(minValue, String(nextMax));
      return;
    }

    setMaxValue(nextText);
    commitChange(minValue, nextText);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="min-w-0 flex-1 rounded-lg px-3 py-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)' }}
      >
        <span className="block text-[10px] font-body font-black text-ink-400">
          Mínimo
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={Number.isFinite(min) ? min : undefined}
          max={Number.isFinite(maxValue) ? Number(maxValue) : undefined}
          step="0.01"
          value={minValue}
          onChange={handleMinChange}
          className="mt-0.5 block w-full bg-transparent p-0 text-sm font-body font-black text-ink-900 outline-none"
          aria-label="Precio minimo"
        />
      </div>
      <span className="flex-shrink-0 text-lg font-body font-semibold text-ink-400">-</span>
      <div
        className="min-w-0 flex-1 rounded-lg px-3 py-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)' }}
      >
        <span className="block text-[10px] font-body font-black text-ink-400">
          Máximo
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={Number.isFinite(minValue) ? Number(minValue) : undefined}
          max={Number.isFinite(max) ? max : undefined}
          step="0.01"
          value={maxValue}
          onChange={handleMaxChange}
          className="mt-0.5 block w-full bg-transparent p-0 text-sm font-body font-black text-ink-900 outline-none"
          aria-label="Precio maximo"
        />
      </div>
    </div>
  );
}

export default function ModalFiltros({
  isOpen, onCerrar,
  filtros, toggleFiltro, limpiarFiltros,
  onPrecioChange,
  priceBounds,
  totalResultados,
}) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, isOpen);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('overflow-hidden');
      requestAnimationFrame(() => {
        panelRef.current?.querySelector('[data-filter-scroll]')?.scrollTo({ top: 0 });
        panelRef.current?.querySelectorAll('.custom-scrollbar').forEach(el => el.scrollTo({ top: 0 }));
      });
    } else {
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, [isOpen]);

  const totalActivos =
    filtros.categorias.length +
    filtros.marcas.length +
    filtros.tamanios.length +
    (Number.isFinite(filtros.precioMin) || Number.isFinite(filtros.precioMax) ? 1 : 0);

  const productosCache = useMemo(() => readProductosCache(), [isOpen]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    productosCache
      .filter(producto => producto?.activo !== false && producto?.categoria)
      .forEach(producto => {
        counts.set(producto.categoria, (counts.get(producto.categoria) || 0) + 1);
      });
    return counts;
  }, [productosCache]);

  const priceRange = useMemo(() => {
    if (Number.isFinite(priceBounds?.min) && Number.isFinite(priceBounds?.max)) {
      return { min: priceBounds.min, max: priceBounds.max };
    }

    const prices = productosCache
      .filter(producto => producto?.activo !== false)
      .map(producto => Number(producto?.precio))
      .filter(price => Number.isFinite(price) && price >= 0);

    if (prices.length === 0) return { min: null, max: null };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [priceBounds, productosCache]);

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
          fixed inset-x-0 bottom-0 z-50 rounded-t-[26px] shadow-2xl
          flex flex-col safe-bottom
          sm:max-w-sm sm:left-auto sm:right-6 sm:rounded-[26px] sm:bottom-6
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-[calc(100%+2rem)]'}
        `}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-soft)',
          maxHeight: '92vh',
        }}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b px-4 py-3"
             style={{ borderColor: 'var(--border-soft)' }}>
          <button
            onClick={onCerrar}
            className="flex h-10 w-14 items-center justify-center rounded-lg transition-colors hover:bg-ink-100"
            style={{
              color: BRAND_PURPLE,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-soft)',
            }}
            aria-label={t('common.close')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-0 flex-1 px-3 text-left text-base font-body font-black text-ink-900">
            Filtrar productos
          </h2>
          <button
            onClick={limpiarFiltros}
            disabled={totalActivos === 0}
            className="text-xs font-body font-black transition-opacity disabled:opacity-40"
            style={{ color: BRAND_PURPLE }}
          >
            Limpiar todo
          </button>
        </div>

        <div data-filter-scroll className="flex-1 overflow-y-auto" style={{ background: 'rgba(255,247,254,0.72)' }}>
          <Seccion
            titulo={t('filters.category')}
            searchable={true}
            searchCount={categorias.length}
            searchPlaceholder={`Buscar entre ${categorias.length} categorias...`}
          >
            {(busqueda) => {
              const filtradas = categorias.filter(cat =>
                cat.label.toLowerCase().includes(busqueda.toLowerCase())
              );
              return (
                <div data-category-list className="flex flex-col gap-1.5">
                  {filtradas.length > 0 ? filtradas.map(cat => (
                    <FilaCategoria
                      key={cat.id}
                      label={cat.label}
                      count={categoryCounts.get(cat.id) || 0}
                      activo={filtros.categorias.includes(cat.id)}
                      onClick={() => toggleFiltro('categorias', cat.id)}
                    />
                  )) : (
                    <p className="px-3 py-2 text-xs font-body text-ink-300">{t('search.noMatches')}</p>
                  )}
                </div>
              );
            }}
          </Seccion>

          <Seccion titulo="Precio">
            <PrecioInputs
              min={priceRange.min}
              max={priceRange.max}
              valueMin={filtros.precioMin}
              valueMax={filtros.precioMax}
              onChange={onPrecioChange}
            />
          </Seccion>

          <Seccion
            titulo={t('filters.brand')}
          >
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

          <Seccion titulo={t('filters.size')}>
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

        <div className="flex flex-shrink-0 gap-3 border-t px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3"
             style={{ borderColor: 'var(--border-soft)' }}>
          <button
            onClick={limpiarFiltros}
            disabled={totalActivos === 0}
            className="flex-1 rounded-full px-4 py-3 text-sm font-body font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              color: BRAND_PURPLE,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-soft)',
            }}
          >
            {t('common.clean')}
          </button>

          <button
            onClick={onCerrar}
            className="flex-[1.8] rounded-full py-3 text-sm font-body font-black text-white transition-all duration-200 active:scale-[0.98]"
            style={{
              background: BRAND_PURPLE,
              boxShadow: '0 4px 16px rgba(123,47,190,0.28)',
            }}
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
