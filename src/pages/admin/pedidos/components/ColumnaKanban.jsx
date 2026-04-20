import { useLanguage } from '../../../../hooks/useLanguage';
import { maskPhone } from '../../../../utils/formatters';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';

export default function ColumnaKanban({ estado, pedidos, onCardClick }) {
  const { t } = useLanguage();
  const meta = ESTADO_META[estado] ?? ESTADO_META['Por Surtir'];
  return (
    <div className="flex-shrink-0 w-80 flex flex-col rounded-2xl overflow-hidden border-2" style={{
      borderColor: meta.bg,
      background: meta.bg,
      minHeight: '220px',
      maxHeight: 'calc(100dvh - 380px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: meta.color }}>
        <h3 className="text-sm font-body font-black text-white flex items-center gap-2">
          <meta.icon size={16} /> {estadoLabel(estado, t)}
        </h3>
        <span className="text-xs font-body font-black text-white bg-black/20 px-2 py-1 rounded-full">
          {pedidos.length}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }} className="bg-admin-elevated space-y-3">
        {pedidos.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-body text-admin-muted">Sin pedidos</p>
          </div>
        ) : (
          pedidos.map(pedido => (
            <button
              key={pedido.id}
              onClick={() => onCardClick(pedido)}
              className="w-full text-left p-3 rounded-xl bg-admin-card border border-admin-border hover:border-admin-border-soft transition-all hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-body font-bold text-sm text-admin-text">{pedido.folio}</p>
                <span className="text-xs font-body px-1.5 py-0.5 rounded-full" style={{ background: meta.color, color: 'white' }}>
                  {t('common.total')}: ${Number(pedido.total).toFixed(0)}
                </span>
              </div>
              <p className="text-xs font-body text-admin-muted truncate">{pedido.cliente_nombre}</p>
              <p className="text-xs font-body text-admin-muted truncate">{maskPhone(pedido.cliente_telefono)}</p>
              <p className="text-[10px] font-body text-admin-inactive mt-1">{new Date(pedido.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
