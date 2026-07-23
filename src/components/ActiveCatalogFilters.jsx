import { SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function ActiveCatalogFilters({ chips = [], onRemove }) {
  const { t } = useLanguage();

  if (chips.length === 0) return null;

  return (
    <div
      className="hide-scrollbar hidden items-center gap-2 overflow-x-auto px-1 py-2 lg:flex"
      aria-label={t('catalog.activeFilters')}
    >
      <span
        className="flex flex-shrink-0 items-center gap-1 text-[11px] font-body font-black"
        style={{ color: 'var(--text-muted)' }}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        {t('catalog.activeFilters')}
      </span>

      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onRemove?.(chip)}
          className="flex min-h-8 flex-shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-body font-black transition-colors hover:bg-purple-50 focus-visible:ring-2"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
          aria-label={t('catalog.removeFilter', { label: chip.label })}
        >
          <span className="max-w-48 truncate">{chip.label}</span>
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
