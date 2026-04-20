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

  if (totalPages <= 1) return null;

  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalResults);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border-soft text-sm">
      <span className="text-admin-text-secondary">
        {t('datatable.pagination.showing', {
          from: start,
          to: end,
          total: totalResults,
        })}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-1 rounded hover:bg-admin-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-admin-text font-bold">
          {currentPage + 1} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1 rounded hover:bg-admin-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
