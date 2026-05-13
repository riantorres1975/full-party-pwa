import { useEffect, useMemo, useState } from 'react';
import { Clock, Search, Tag, TrendingUp, X } from 'lucide-react';
import { categorias as CATEGORIAS_CONFIG, SIMBOLO_MONEDA } from '../data/productos';
import { useDebounce } from '../hooks/useDebounce';
import { useLanguage } from '../hooks/useLanguage';
import { obtenerPrecioAplicable } from '../utils/precios';
import { fuzzySearch } from '../utils/fuzzySearch';

export const RECENT_SEARCHES_KEY = 'fullparty_recent_searches';

const POPULAR_TERMS = ['globos', 'velas', 'cortinas', 'guirnaldas', 'numero', 'foil', 'cumpleanos', 'confeti'];

const SEARCH_KEYS = [
  { name: 'nombre', weight: 0.55 },
  { name: 'descripcion', weight: 0.18 },
  { name: 'categoria', weight: 0.15 },
  { name: 'marca', weight: 0.08 },
  { name: 'tamano', weight: 0.04 },
];

function readRecentSearches() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query) {
  const clean = String(query || '').trim();
  if (!clean) return;

  try {
    const current = readRecentSearches();
    const deduped = current.filter(item => item.toLowerCase() !== clean.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([clean, ...deduped].slice(0, 5)));
  } catch {
    // Ignore storage errors.
  }
}

function removeRecentSearch(query) {
  try {
    const next = readRecentSearches().filter(item => item !== query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export default function SearchPanel({
  open,
  query,
  productos,
  categoryStats,
  onSearch,
  onSelectProduct,
  onSelectCategory,
}) {
  const [recentSearches, setRecentSearches] = useState([]);
  const debouncedQuery = useDebounce(query, 300);
  const { t } = useLanguage();

  useEffect(() => {
    if (open) setRecentSearches(readRecentSearches());
  }, [open]);

  const suggestions = useMemo(() => {
    const clean = debouncedQuery.trim();
    if (!clean) return [];
    const activeProducts = (productos || []).filter(producto => producto.activo !== false);
    return fuzzySearch(activeProducts, clean, SEARCH_KEYS, { threshold: 0.38 }).slice(0, 8);
  }, [debouncedQuery, productos]);

  const topCategories = useMemo(() => (categoryStats || []).slice(0, 3), [categoryStats]);

  const categoryLabelById = useMemo(
    () => Object.fromEntries(CATEGORIAS_CONFIG.map(category => [category.id, category.label])),
    []
  );

  const commitSearch = (term) => {
    saveRecentSearch(term);
    setRecentSearches(readRecentSearches());
    onSearch?.(term);
  };

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[75] overflow-hidden rounded-2xl shadow-2xl"
      style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-soft)',
        boxShadow: '0 18px 48px rgba(26,7,51,0.18)',
      }}
    >
      {!hasQuery ? (
        <div className="max-h-[70vh] overflow-y-auto p-3 custom-scrollbar">
          <section>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-body font-black uppercase tracking-wide text-ink-400">
              <Clock className="h-3.5 w-3.5" />
              {t('search.recent')}
            </div>
            {recentSearches.length > 0 ? (
              <div className="space-y-1">
                {recentSearches.map(term => (
                  <div
                    key={term}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1 transition-colors hover:bg-ink-50"
                  >
                    <button
                      type="button"
                      onClick={() => commitSearch(term)}
                      className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                    >
                      <Clock className="h-4 w-4 flex-shrink-0 text-ink-300" />
                      <span className="min-w-0 flex-1 truncate text-sm font-body font-bold text-ink-700">
                        {term}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecentSearches(removeRecentSearch(term))}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-ink-100 hover:text-fiesta-magenta"
                      aria-label={t('search.removeRecent', { term })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl px-3 py-2 text-xs font-body font-bold text-ink-400"
                 style={{ background: 'var(--surface-card)' }}>
                {t('search.noRecent')}
              </p>
            )}
          </section>

          <section className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-body font-black uppercase tracking-wide text-ink-400">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('search.popular')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TERMS.map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => commitSearch(term)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-body font-black transition-all duration-150 active:scale-95"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          {topCategories.length > 0 && (
            <section className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-body font-black uppercase tracking-wide text-ink-400">
                <Tag className="h-3.5 w-3.5" />
                {t('search.byCategory')}
              </div>
              <div className="overflow-hidden rounded-xl"
                   style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)' }}>
                {topCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory?.(category)}
                    className="flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left last:border-b-0 transition-colors hover:bg-ink-50"
                    style={{ borderColor: 'var(--border-soft)' }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-body font-black text-ink-800">
                      {category.label}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-body font-black"
                          style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto p-2 custom-scrollbar">
          {suggestions.length > 0 ? (
            suggestions.map(producto => {
              const price = obtenerPrecioAplicable(producto, 1);
              return (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => {
                    saveRecentSearch(query);
                    onSelectProduct?.(producto);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink-50"
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}
                  >
                    <Search className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-body font-black text-ink-900">
                      {producto.nombre}
                    </span>
                    <span className="block truncate text-[11px] font-body font-bold text-ink-400">
                      {categoryLabelById[producto.categoria] || producto.categoria || t('common.products')}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-sm font-body font-black text-ink-900">
                    {SIMBOLO_MONEDA}{Number(price || 0).toFixed(2)}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-4 py-8 text-center text-sm font-body font-bold text-ink-400">
              {t('search.noMatches')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
