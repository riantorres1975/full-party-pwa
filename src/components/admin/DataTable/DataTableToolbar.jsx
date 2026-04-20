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

  if (selectionCount > 0) {
    return (
      <div className="fixed bottom-6 left-6 right-6 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-ink-600 text-white rounded-lg p-4 shadow-elevated flex items-center gap-3 animate-slide-up-toast z-40">
        <span className="text-sm font-bold">
          {t('datatable.selected', { count: selectionCount })}
        </span>

        <div className="flex gap-2 ml-auto">
          {bulkActions?.map(action => (
            <Can key={action.id} permission={action.permission} fallback={null}>
              <button
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
          onClick={onClearSelection}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Clear selection"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  if (!search && !searchPlaceholder) return null;

  return (
    <div className="px-4 py-3 border-b border-admin-border-soft bg-admin-elevated">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder || t('datatable.search')}
          className="w-full pl-9 pr-4 py-2 rounded border border-admin-border bg-admin-input text-admin-text placeholder-admin-text-secondary outline-none focus:ring-2 focus:ring-ink-500/50"
        />
      </div>
    </div>
  );
}
