import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

export default function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalResults,
  onPageChange,
}) {
  const { t } = useLanguage();

  if (totalResults === 0) return null;

  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalResults);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border-soft px-3 py-2 text-sm sm:px-4">
      <span aria-live="polite" className="text-admin-text-secondary">
        {t('datatable.pagination.showing', {
          from: start,
          to: end,
          total: totalResults,
        })}
      </span>

      {totalPages > 1 && <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="flex size-10 items-center justify-center rounded-lg border border-admin-border hover:bg-admin-elevated disabled:opacity-45"
          aria-label={t('datatable.pagination.previous')}
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-admin-text font-bold">
          {currentPage + 1} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="flex size-10 items-center justify-center rounded-lg border border-admin-border hover:bg-admin-elevated disabled:opacity-45"
          aria-label={t('datatable.pagination.next')}
        >
          <ChevronRight size={18} />
        </button>
      </div>}
    </div>
  );
}
