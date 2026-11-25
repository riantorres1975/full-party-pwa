import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import Can from '../../auth/Can';

export default function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  selectionCount,
  onClearSelection,
  bulkActions,
}) {
  const { t } = useLanguage();
  const searchRef = useRef(null);

  if (selectionCount > 0) {
    return (
      <div className="flex flex-wrap items-center gap-3 border-b border-admin-border bg-ink-600 p-3 text-white">
        <span className="text-sm font-bold">
          {t('datatable.selected', { count: selectionCount })}
        </span>

        <div className="flex gap-2 ml-auto">
          {bulkActions?.map(action => (
            <Can key={action.id} permission={action.permission} fallback={null}>
              <button
                type="button"
                onClick={action.onClick}
                className="flex items-center gap-2 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-sm font-bold"
              >
                {action.icon && <action.icon size={16} />}
                {action.label}
              </button>
            </Can>
          ))}
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label={t('datatable.clear_selection')}
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-admin-border-soft px-3 py-3 sm:px-4">
      <div className="relative">
        <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder || t('datatable.search')}
          aria-label={searchPlaceholder || t('datatable.search')}
          className="min-h-11 w-full rounded-xl border border-admin-border bg-admin-input py-2 pl-9 pr-11 text-base text-admin-text outline-none placeholder:text-admin-muted focus:ring-2 focus:ring-violet-600/60 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button type="button" onClick={() => { onSearchChange(''); searchRef.current?.focus(); }} aria-label={t('datatable.no_matches.clear')} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-elevated">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
