import { useLanguage } from '../../../hooks/useLanguage';

export default function DataTableRow({
  row,
  columns,
  rowKey,
  selectable,
  isSelected,
  onToggle,
  onRowClick,
  rowActionLabel,
  variant = 'row',
}) {
  const { t } = useLanguage();
  const rowId = row[rowKey];
  const handleRowClick = (event) => {
    if (event.defaultPrevented || event.target.closest('button, a, label, input, select, textarea, details')) return;
    onRowClick?.(row);
  };

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
    const actions = columns.filter(col => col.mobile === 'action');
    const fields = columns.filter(col => col.mobile !== 'action');
    const visible = fields.filter((col, idx) => col.mobile === 'primary' || (idx < 3 && col.mobile !== 'detail'));
    const extra = fields.filter(col => !visible.includes(col));
    const renderField = (col) => {
      const colKey = col.key ?? col.id;
      return (
        <div key={colKey} className="grid min-w-0 grid-cols-[minmax(4rem,0.75fr)_minmax(0,1.25fr)] items-start gap-2">
          <dt className="text-xs font-bold text-admin-muted">{col.label}</dt>
          <dd className="min-w-0 break-words text-sm text-admin-text">{renderCellValue(col, row[colKey])}</dd>
        </div>
      );
    };
    return (
      <li
        onClick={onRowClick ? handleRowClick : undefined}
        className="space-y-3 rounded-xl border border-admin-border bg-admin-card px-3.5 py-3 sm:px-4"
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
        <dl className="space-y-2">{visible.map(renderField)}</dl>
        {extra.length > 0 && (
          <details className="border-t border-admin-border-soft">
            <summary className="cursor-pointer py-2 text-xs font-bold text-admin-text-secondary">{t('datatable.more_details')}</summary>
            <dl className="space-y-2 pb-1">{extra.map(renderField)}</dl>
          </details>
        )}
        {(actions.length > 0 || onRowClick) && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map(col => <div key={col.key ?? col.id}>{renderCellValue(col, row[col.key ?? col.id])}</div>)}
            {onRowClick && actions.length === 0 && (
              <button type="button" onClick={() => onRowClick(row)} className="min-h-11 rounded-lg border border-admin-border px-3 text-sm font-bold text-admin-text-secondary hover:bg-admin-elevated">
                {rowActionLabel ?? t('datatable.open_row')}
              </button>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <tr
      onClick={onRowClick && !selectable ? handleRowClick : undefined}
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
