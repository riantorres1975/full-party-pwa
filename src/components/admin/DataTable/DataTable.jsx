import { useLanguage } from '../../../hooks/useLanguage';
import { useDataTable } from './useDataTable';
import DataTableToolbar from './DataTableToolbar';
import DataTableHeader from './DataTableHeader';
import DataTableRow from './DataTableRow';
import DataTablePagination from './DataTablePagination';
import DataTableEmpty from './DataTableEmpty';
import DataTableSkeleton from './DataTableSkeleton';

export default function DataTable({
  data = [],
  loading = false,
  error = null,
  columns = [],
  rowKey = 'id',
  onRowClick,
  searchable = true,
  searchPlaceholder,
  selectable = false,
  bulkActions = [],
  pagination = { pageSize: 25 },
  emptyState = {},
  onRetry,
  className = '',
}) {
  const { t } = useLanguage();

  const {
    sortKey,
    sortDir,
    search,
    page,
    selection,
    setSort,
    setSearch,
    setPage,
    toggleRow,
    toggleAll,
    clearSelection,
    paginatedData,
    totalPages,
    currentPage,
    totalResults,
  } = useDataTable({
    data,
    pageSize: pagination.pageSize,
  });

  const allIds = data.map(row => row[rowKey]);
  const selectAllChecked = selection.size === allIds.length && allIds.length > 0;

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-admin-text mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded bg-ink-500 text-white font-bold hover:bg-ink-600 transition-colors"
          >
            {t('common.retry')}
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return <DataTableSkeleton columnCount={columns.length} rowCount={5} />;
  }

  if (totalResults === 0) {
    return (
      <DataTableEmpty
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  return (
    <div className={`border border-admin-border rounded-lg overflow-hidden bg-admin-card ${className}`}>
      {searchable && (
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          selectionCount={selection.size}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
        />
      )}

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
                onRowClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden p-4 space-y-2">
        {paginatedData.map(row => (
          <DataTableRow
            key={row[rowKey]}
            row={row}
            columns={columns}
            rowKey={rowKey}
            selectable={selectable}
            isSelected={selection.has(row[rowKey])}
            onToggle={toggleRow}
            onRowClick={onRowClick}
            variant="card"
          />
        ))}
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pagination.pageSize}
        totalResults={totalResults}
        onPageChange={setPage}
      />
    </div>
  );
}
