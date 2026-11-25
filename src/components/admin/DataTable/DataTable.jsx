import { useLanguage } from '../../../hooks/useLanguage';
import { useDataTable } from './useDataTable';
import DataTableToolbar from './DataTableToolbar';
import DataTableHeader from './DataTableHeader';
import DataTableRow from './DataTableRow';
import DataTablePagination from './DataTablePagination';
import DataTableEmpty from './DataTableEmpty';
import DataTableSkeleton from './DataTableSkeleton';
import DataErrorState from '../DataErrorState';

export default function DataTable({
  data = [],
  loading = false,
  error = null,
  columns = [],
  rowKey = 'id',
  onRowClick,
  isRowClickable,
  rowActionLabel,
  searchable = true,
  searchPlaceholder,
  searchKeys,
  selectable = false,
  bulkActions = [],
  pagination = { pageSize: 25 },
  emptyState = {},
  onRetry,
  className = '',
}) {
  const { t } = useLanguage();
  const pageSize = pagination.pageSize ?? 25;

  const {
    sortKey,
    sortDir,
    search,
    page,
    selection,
    setSort,
    setSortChoice,
    setSearch,
    setPage,
    toggleRow,
    toggleAll,
    clearSelection,
    sortedData,
    paginatedData,
    totalPages,
    currentPage,
    totalResults,
  } = useDataTable({
    data,
    columns,
    searchKeys,
    pageSize,
  });

  const allIds = sortedData.map(row => row[rowKey]);
  const selectAllChecked = allIds.length > 0 && allIds.every(id => selection.has(id));

  if (error) {
    return <DataErrorState message={error} onRetry={onRetry} compact />;
  }

  if (loading) {
    return <DataTableSkeleton columnCount={columns.length} rowCount={5} />;
  }

  if (data.length === 0) {
    return (
      <DataTableEmpty
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-admin-border bg-admin-card ${className}`}>
      {searchable && (
        <DataTableToolbar
          search={search}
          onSearchChange={(value) => {
            clearSelection();
            setSearch(value);
          }}
          searchPlaceholder={searchPlaceholder}
          selectionCount={selection.size}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
        />
      )}

      {columns.some(col => col.sortable) && totalResults > 0 && (
        <label className="flex items-center gap-2 border-b border-admin-border-soft px-3 py-2 text-xs font-bold text-admin-muted lg:hidden">
          {t('datatable.sort')}
          <select
            value={sortKey ? `${sortKey}:${sortDir}` : ''}
            onChange={event => setSortChoice(...event.target.value.split(':'))}
            className="min-h-10 min-w-0 flex-1 rounded-lg border border-admin-border bg-admin-input px-2 text-sm text-admin-text"
          >
            <option value="">{t('datatable.sort.default')}</option>
            {columns.filter(col => col.sortable).flatMap(col => ['asc', 'desc'].map(dir => (
              <option key={`${col.key ?? col.id}:${dir}`} value={`${col.key ?? col.id}:${dir}`}>
                {t(`datatable.sort.${dir}`, { column: col.label })}
              </option>
            )))}
          </select>
        </label>
      )}

      {totalResults === 0 ? (
        <DataTableEmpty
          title={t('datatable.no_matches.title')}
          description={t('datatable.no_matches.description')}
          actionLabel={t('datatable.no_matches.clear')}
          onAction={() => setSearch('')}
        />
      ) : (
        <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <DataTableHeader
            columns={columns}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={setSort}
            selectable={selectable}
            selectAllChecked={selectAllChecked}
            onSelectAll={toggleAll}
            allIds={allIds}
          />
          <tbody>
            {paginatedData.map(row => (
              <DataTableRow
                key={row[rowKey]}
                row={row}
                columns={columns}
                rowKey={rowKey}
                selectable={selectable}
                isSelected={selection.has(row[rowKey])}
                onToggle={toggleRow}
                onRowClick={!isRowClickable || isRowClickable(row) ? onRowClick : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <ul role="list" className="space-y-2 bg-admin-elevated/50 p-3 lg:hidden">
        {paginatedData.map(row => (
          <DataTableRow
            key={row[rowKey]}
            row={row}
            columns={columns}
            rowKey={rowKey}
            selectable={selectable}
            isSelected={selection.has(row[rowKey])}
            onToggle={toggleRow}
            onRowClick={!isRowClickable || isRowClickable(row) ? onRowClick : undefined}
            rowActionLabel={rowActionLabel}
            variant="card"
          />
        ))}
      </ul>

      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalResults={totalResults}
        onPageChange={setPage}
      />
        </>
      )}
    </div>
  );
}
