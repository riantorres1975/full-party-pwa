import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';

export default function ClienteHistorialPedidos({ pedidos, onRowClick }) {
  const { t, lang } = useLanguage();

  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-admin-text-secondary">{t('common.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pedidos.map(pedido => {
        const meta = ESTADO_META[pedido.estado] || {};
        const Icon = meta.icon;
        const fecha = new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX');
        const total = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 0,
        }).format(Number(pedido.total) || 0);

        return (
          <button
            key={pedido.id}
            onClick={() => onRowClick && onRowClick(pedido)}
            className="w-full p-3 rounded border border-admin-border-soft hover:bg-admin-elevated transition-colors text-left active:scale-95 transition-transform"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-bold text-admin-text text-sm">
                {pedido.folio || `#${pedido.id.substring(0, 8)}`}
              </span>
              <span className="text-xs text-admin-text-secondary">
                {fecha}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold" style={{ color: meta.color, background: `${meta.color}22` }}>
                {Icon && <Icon size={12} />}
                {estadoLabel(pedido.estado, t)}
              </div>
              <span className="font-bold text-admin-text">
                {total}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
