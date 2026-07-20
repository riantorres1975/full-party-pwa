import { useLanguage } from '../../../hooks/useLanguage';

export default function DataTableRow({
  row,
  columns,
  rowKey,
  selectable,
  isSelected,
  onToggle,
  onRowClick,
  formatters,
  variant = 'row',
}) {
  const { t } = useLanguage();
  const rowId = row[rowKey];

  const handleRowKeyDown = (event) => {
    if (event.target !== event.currentTarget || !onRowClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onRowClick(row);
  };

  const renderCellValue = (col, value) => {
    if (col.render) {
      return col.render(row);
    }

    if (col.format === 'currency') {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
      }).format(Number(value) || 0);
    }

    if (col.format === 'date') {
      if (!value) return '—';
      return new Date(value).toLocaleDateString('es-MX');
    }

    if (col.format === 'datetime') {
      if (!value) return '—';
      return new Date(value).toLocaleString('es-MX');
    }

    if (col.format === 'relative') {
      if (!value) return '—';
      const date = new Date(value);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins}m`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 30) return `Hace ${diffDays}d`;
      return new Date(value).toLocaleDateString('es-MX');
    }

    return value ?? '—';
  };

  if (variant === 'card') {
    return (
      <div
        onClick={() => onRowClick && onRowClick(row)}
        onKeyDown={handleRowKeyDown}
        tabIndex={onRowClick ? 0 : undefined}
        className={`p-4 border-b border-admin-border-soft bg-admin-card rounded-lg ${
          onRowClick ? 'cursor-pointer active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-500' : ''
        }`}
      >
        {selectable && (
          <div className="mb-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(rowId)}
              className="rounded border-admin-border cursor-pointer accent-ink-500"
              onClick={(e) => e.stopPropagation()}
              aria-label={t('datatable.select_row', { id: rowId })}
            />
          </div>
        )}
        <div className="space-y-2">
          {columns.slice(0, 3).map(col => {
            const colKey = col.key ?? col.id;
            return (
              <div key={colKey} className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-admin-text-secondary">
                  {col.label}
                </span>
                <span className="text-sm font-body text-admin-text text-right">
                  {renderCellValue(col, row[colKey])}
                </span>
              </div>
            );
          })}
          {columns.length > 3 && (
            <details className="mt-2 pt-2 border-t border-admin-border-soft">
              <summary className="text-xs font-bold text-ink-500 cursor-pointer">
                Ver más
              </summary>
              <div className="space-y-2 mt-2">
                {columns.slice(3).map(col => {
                  const colKey = col.key ?? col.id;
                  return (
                    <div key={colKey} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-admin-text-secondary">
                        {col.label}
                      </span>
                      <span className="text-sm font-body text-admin-text text-right">
                        {renderCellValue(col, row[colKey])}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <tr
      onClick={() => onRowClick && !selectable && onRowClick(row)}
      onKeyDown={onRowClick && !selectable ? handleRowKeyDown : undefined}
      tabIndex={onRowClick && !selectable ? 0 : undefined}
      className={`border-b border-admin-border-soft hover:bg-admin-elevated transition-colors ${
        onRowClick && !selectable ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-500' : ''
      }`}
    >
      {selectable && (
        <td className="px-4 py-3 w-12">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(rowId)}
            className="rounded border-admin-border cursor-pointer accent-ink-500"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('datatable.select_row', { id: rowId })}
          />
        </td>
      )}
      {columns.map(col => {
        const colKey = col.key ?? col.id;
        return (
          <td
            key={colKey}
            className="px-4 py-3 text-sm text-admin-text"
            style={{ textAlign: col.align || col.alignment || 'left' }}
          >
            {renderCellValue(col, row[colKey])}
          </td>
        );
      })}
    </tr>
  );
}
