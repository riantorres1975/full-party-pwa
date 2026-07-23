import { ArrowDownUp, ChevronDown, Heart, RotateCcw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import ActiveCatalogFilters from './ActiveCatalogFilters';

export function CatalogToolbarSkeleton() {
  return (
    <div
      className="mx-3 mb-1 mt-2 flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-3 py-2 sm:mx-4 lg:mx-0 lg:py-1.5"
      style={{ background: 'var(--surface-card-alpha80)', borderColor: 'var(--border-soft)' }}
      aria-hidden="true"
    >
      <div className="h-4 w-24 rounded-full bg-ink-100 skeleton-shimmer" />
      <div className="h-10 w-20 rounded-xl bg-ink-100 skeleton-shimmer" />
      <div className="h-10 w-32 rounded-xl bg-ink-100 skeleton-shimmer" />
    </div>
  );
}

export default function CatalogToolbar({
  total,
  sortOrder,
  onSortChange,
  isFiltered = false,
  onClear,
  filterLabel,
  favoriteCount = 0,
  showFavorites = false,
  activeChips = [],
  onRemoveFilter,
  onToggleFavorites,
}) {
  const { t } = useLanguage();

  return (
    <div
      className="mx-3 mb-1 mt-2 flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-3 py-2 sm:mx-4 lg:mx-0 lg:py-1.5"
      style={{
        background: 'var(--surface-card-alpha80)',
        borderColor: 'var(--border-soft)',
        boxShadow: '0 6px 18px rgba(82, 39, 143, 0.06)',
      }}
      aria-label={t('catalog.toolbarLabel')}
    >
      <div className="min-w-0">
        <p className="font-body text-sm font-black" style={{ color: 'var(--text-primary)' }}>
          {total === 1 ? t('grid.resultCountOne') : t('grid.resultCount', { count: total })}
        </p>
        {filterLabel && (
          <p className="truncate text-[11px] font-body font-bold" style={{ color: 'var(--text-secondary)' }}>
            {t('catalog.viewingCategory', { category: filterLabel })}
          </p>
        )}
        <button
          type="button"
          onClick={onClear}
          className={`mt-0.5 min-h-6 items-center gap-1 text-[11px] font-body font-black transition-opacity hover:opacity-70 ${isFiltered ? 'inline-flex' : 'hidden lg:invisible lg:pointer-events-none lg:inline-flex'}`}
          style={{ color: 'var(--accent-primary)' }}
          aria-hidden={!isFiltered}
          tabIndex={isFiltered ? 0 : -1}
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          {t('catalog.clearView')}
        </button>
      </div>

      <ActiveCatalogFilters chips={activeChips} onRemove={onRemoveFilter} />

      <button
        type="button"
        onClick={onToggleFavorites}
        className="flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-xl border px-2 text-xs font-body font-black transition-colors focus-visible:ring-2 sm:px-3"
        style={showFavorites
          ? { background: '#fff0f7', borderColor: '#ff3dac', color: '#d91b83' }
          : { background: 'var(--surface-input)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        aria-pressed={showFavorites}
        aria-label={showFavorites
          ? t('catalog.hideFavorites')
          : t('catalog.showFavorites', { count: favoriteCount })}
      >
        <Heart className="h-4 w-4" fill={showFavorites ? 'currentColor' : 'none'} aria-hidden="true" />
        <span className="hidden sm:inline">{t('catalog.favorites')}</span>
        <span>{favoriteCount}</span>
      </button>

      <label className="relative flex min-w-0 max-w-[11.5rem] flex-1 items-center sm:flex-none" htmlFor="catalog-sort">
        <ArrowDownUp
          className="pointer-events-none absolute left-3 h-3.5 w-3.5"
          style={{ color: 'var(--text-secondary)' }}
          aria-hidden="true"
        />
        <span className="sr-only">{t('catalog.sortLabel')}</span>
        <select
          id="catalog-sort"
          value={sortOrder}
          onChange={(event) => onSortChange(event.target.value)}
          className="min-h-10 w-full appearance-none rounded-xl border py-2 pl-8 pr-7 text-xs font-body font-black outline-none transition-colors focus-visible:ring-2"
          style={{
            background: 'var(--surface-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="featured">{t('catalog.sortFeatured')}</option>
          <option value="name-asc">{t('catalog.sortName')}</option>
          <option value="price-asc">{t('catalog.sortPriceLow')}</option>
          <option value="price-desc">{t('catalog.sortPriceHigh')}</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 h-3.5 w-3.5"
          style={{ color: 'var(--text-secondary)' }}
          aria-hidden="true"
        />
      </label>
    </div>
  );
}
