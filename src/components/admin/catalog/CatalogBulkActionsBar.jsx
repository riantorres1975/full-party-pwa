import { Trash2, X } from 'lucide-react';

export default function CatalogBulkActionsBar({
  selectedCount,
  categories,
  brands,
  processing,
  canEdit,
  canDelete,
  onActivate,
  onHide,
  onChangeCategory,
  onChangeBrand,
  onDelete,
  onClear,
  t,
}) {
  if (!Number.isFinite(selectedCount) || selectedCount <= 0) return null;

  const safeCategories = Array.isArray(categories)
    ? categories.filter(category => typeof category === 'string' && category.trim())
    : [];
  const safeBrands = Array.isArray(brands)
    ? brands.filter(brand => typeof brand === 'string' && brand.trim())
    : [];

  return (
    <div
      className="fixed left-3 right-3 bottom-20 z-30 flex items-center gap-2 rounded-xl bg-ink-700 px-3 py-2 text-white shadow-elevated sm:static sm:inset-auto sm:z-auto sm:w-full"
      role="toolbar"
      aria-label={t('admin.catalog.bulkActions')}
    >
      <span className="whitespace-nowrap text-xs font-body font-black">
        {t('admin.catalog.selectedCount', { count: selectedCount })}
      </span>

      <div className="hide-scrollbar flex flex-1 justify-end gap-1.5 overflow-x-auto">
        {canEdit && (
          <>
            <button
              type="button"
              onClick={onActivate}
              disabled={processing}
              className="whitespace-nowrap rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-body font-black hover:bg-white/25 disabled:opacity-50"
            >
              {t('admin.catalog.activate')}
            </button>
            <button
              type="button"
              onClick={onHide}
              disabled={processing}
              className="whitespace-nowrap rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-body font-black hover:bg-white/25 disabled:opacity-50"
            >
              {t('admin.catalog.hide')}
            </button>
            <select
              defaultValue=""
              onChange={event => {
                if (event.target.value) onChangeCategory(event.target.value);
                event.target.value = '';
              }}
              disabled={processing}
              className="max-w-[150px] rounded-lg border border-white/20 bg-ink-600 px-2 py-1.5 text-[11px] font-body font-black text-white outline-none disabled:opacity-50"
              aria-label={t('admin.catalog.changeCategory')}
            >
              <option value="">{t('admin.catalog.changeCategory')}</option>
              {safeCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              defaultValue=""
              onChange={event => {
                if (event.target.value) onChangeBrand(event.target.value);
                event.target.value = '';
              }}
              disabled={processing}
              className="max-w-[150px] rounded-lg border border-white/20 bg-ink-600 px-2 py-1.5 text-[11px] font-body font-black text-white outline-none disabled:opacity-50"
              aria-label={t('admin.catalog.changeBrand')}
            >
              <option value="">{t('admin.catalog.changeBrand')}</option>
              {safeBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={processing}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-red-500/80 px-2.5 py-1.5 text-[11px] font-body font-black hover:bg-red-500 disabled:opacity-50"
          >
            <Trash2 size={13} /> {t('admin.catalog.delete')}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="rounded-lg p-1.5 hover:bg-white/15"
        aria-label={t('datatable.clear_selection')}
      >
        <X size={16} />
      </button>
    </div>
  );
}
