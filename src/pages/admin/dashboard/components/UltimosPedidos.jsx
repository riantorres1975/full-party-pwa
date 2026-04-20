import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADO_META } from '../../../../lib/estadoMeta';

export default function UltimosPedidos({ data, loading, onRowClick }) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-admin-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 bg-admin-elevated rounded-lg">
        <p className="text-admin-text-secondary">{t('admin.dashboard.chart.no_data')}</p>
      </div>
    );
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(val);

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.now');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-admin-border-soft">
        <h3 className="text-sm font-body font-bold text-admin-text">
          {t('admin.dashboard.recent_orders')}
        </h3>
      </div>

      <div className="hidden lg:block">
        <table className="w-full text-sm">
          <thead className="bg-admin-elevated">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-admin-text-secondary">
                {t('admin.orders.folio')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold text-admin-text-secondary">
                {t('admin.orders.phone')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold text-admin-text-secondary">
                {t('admin.orders.status')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-bold text-admin-text-secondary">
                {t('admin.orders.total')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-bold text-admin-text-secondary">
                {t('common.when')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map(pedido => {
              const meta = ESTADO_META[pedido.estado] || {};
              const Icon = meta.icon;

              return (
                <tr
                  key={pedido.id}
                  onClick={() => onRowClick && onRowClick(pedido)}
                  className="border-b border-admin-border-soft hover:bg-admin-elevated transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-bold text-admin-text">
                    {pedido.folio || `#${pedido.id.substring(0, 8)}`}
                  </td>
                  <td className="px-4 py-3 text-admin-text-secondary text-xs">
                    {pedido.cliente_telefono}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold" style={{ color: meta.color, background: `${meta.color}22` }}>
                      {Icon && <Icon size={14} />}
                      {pedido.estado}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-admin-text text-right font-bold">
                    {formatCurrency(pedido.total)}
                  </td>
                  <td className="px-4 py-3 text-admin-text-secondary text-right text-xs">
                    {getRelativeTime(pedido.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-2 p-4">
        {data.map(pedido => {
          const meta = ESTADO_META[pedido.estado] || {};
          return (
            <div
              key={pedido.id}
              onClick={() => onRowClick && onRowClick(pedido)}
              className="p-3 bg-admin-elevated rounded cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-bold text-admin-text">
                  {pedido.folio || `#${pedido.id.substring(0, 8)}`}
                </span>
                <span className="text-xs text-admin-text-secondary">
                  {getRelativeTime(pedido.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-admin-text-secondary">
                  {pedido.cliente_telefono}
                </span>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold px-2 py-1 rounded" style={{ color: meta.color, background: `${meta.color}22` }}>
                    {pedido.estado}
                  </div>
                  <span className="text-sm font-bold text-admin-text">
                    {formatCurrency(pedido.total)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
