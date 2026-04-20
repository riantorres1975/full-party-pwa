import { ChevronUp, ChevronDown } from 'lucide-react';

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
  return (
    <thead className="hidden lg:table-header-group border-b border-admin-border-soft bg-admin-elevated">
      <tr>
        {selectable && (
          <th className="px-4 py-3 w-12">
            <input
              type="checkbox"
              checked={selectAllChecked}
              onChange={() => onSelectAll(allIds)}
              className="rounded border-admin-border cursor-pointer accent-ink-500"
              aria-label="Select all rows"
            />
          </th>
        )}
        {columns.map(col => {
          const isSorted = sortKey === col.key;
          const isAsc = isSorted && sortDir === 'asc';
          const isDesc = isSorted && sortDir === 'desc';

          return (
            <th
              key={col.key}
              onClick={() => col.sortable && onSort(col.key)}
              className={`px-4 py-3 text-left text-sm font-body font-bold text-admin-text ${
                col.sortable ? 'cursor-pointer hover:bg-admin-muted transition-colors' : ''
              }`}
              style={{ textAlign: col.align || 'left' }}
            >
              <div className="flex items-center gap-2">
                {col.label}
                {col.sortable && (
                  <span className="inline-flex text-admin-text-secondary">
                    {isAsc && <ChevronUp size={16} />}
                    {isDesc && <ChevronDown size={16} />}
                    {!isSorted && <ChevronUp size={16} className="opacity-20" />}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
