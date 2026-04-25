import { useLanguage } from '../../../../hooks/useLanguage';
import { maskPhone } from '../../../../utils/formatters';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';

export default function ColumnaKanban({ estado, pedidos, onCardClick }) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[estado] ?? ESTADO_META['Por Surtir'];
  return (
    <div className="min-w-0 flex flex-col border border-admin-border rounded-lg overflow-hidden"
         style={{ minHeight: 220, maxHeight: 'calc(100dvh - 380px)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: meta.color }}>
        <h3 className="text-sm font-body font-black text-white flex items-center gap-2">
          <meta.icon size={16} /> {estadoLabel(estado, t)}
        </h3>
        <span className="text-xs font-body font-black text-white bg-black/20 px-2 py-1 rounded-full">
          {pedidos.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-admin-elevated">
        {pedidos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-admin-muted">
            {t('common.noOrders')}
          </div>
        ) : (
          pedidos.map(pedido => (
            <button
              key={pedido.id}
              onClick={() => onCardClick(pedido)}
              className="w-full text-left p-3 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-elevated hover:border-admin-border-soft transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-body font-bold text-sm text-admin-text">{pedido.folio}</p>
                <span className="text-xs font-body px-1.5 py-0.5 rounded-full" style={{ background: meta.color, color: 'white' }}>
                  {t('common.total')}: ${Number(pedido.total).toFixed(0)}
                </span>
              </div>
              <p className="text-xs font-body text-admin-muted truncate">{pedido.cliente_nombre}</p>
              <p className="text-xs font-body text-admin-muted truncate">{maskPhone(pedido.cliente_telefono)}</p>
              <p className="text-[10px] font-body text-admin-inactive mt-1">{new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
