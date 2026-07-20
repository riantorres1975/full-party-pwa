import { ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

export default function DataTableHeader({
  columns,
  sortKey,
  sortDir,
  onSort,
  selectable,
  selectAllChecked,
  onSelectAll,
  allIds,
}) {
  const { t } = useLanguage();

  return (
    <thead className="border-b border-admin-border-soft bg-admin-elevated">
      <tr>
        {selectable && (
          <th className="px-4 py-3 w-12">
            <input
              type="checkbox"
              checked={selectAllChecked}
              onChange={() => onSelectAll(allIds)}
              className="rounded border-admin-border cursor-pointer accent-ink-500"
              aria-label={t('datatable.select_all')}
            />
          </th>
        )}
        {columns.map(col => {
          const colKey = col.key ?? col.id;
          const isSorted = sortKey === colKey;
          const isAsc = isSorted && sortDir === 'asc';
          const isDesc = isSorted && sortDir === 'desc';

          return (
            <th
              key={colKey}
              className="px-4 py-3 text-left text-sm font-body font-bold text-admin-text"
              style={{ textAlign: col.align || col.alignment || 'left' }}
              aria-sort={col.sortable ? (isAsc ? 'ascending' : isDesc ? 'descending' : 'none') : undefined}
            >
              {col.sortable ? (
                <button
                  type="button"
                  onClick={() => onSort(colKey)}
                  className={`flex w-full items-center gap-2 rounded-sm hover:text-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-500 ${
                    (col.align || col.alignment) === 'right' ? 'justify-end' : ''
                  }`}
                >
                  {col.label}
                  <span className="inline-flex text-admin-text-secondary">
                    {isAsc && <ChevronUp size={16} />}
                    {isDesc && <ChevronDown size={16} />}
                    {!isSorted && <ChevronUp size={16} className="opacity-20" />}
                  </span>
                </button>
              ) : col.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
