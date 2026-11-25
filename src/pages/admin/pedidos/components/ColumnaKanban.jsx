import { useLanguage } from '../../../../hooks/useLanguage';
import { maskPhone } from '../../../../utils/formatters';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import EntregaPedido from './EntregaPedido';

export default function ColumnaKanban({ estado, pedidos, sucursalPorPedidoId, onCardClick }) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[estado] ?? ESTADO_META['Por Surtir'];
  return (
    <section className="min-w-0 flex flex-col border border-admin-border rounded-xl overflow-hidden min-h-56 max-h-[calc(100dvh-270px)]">
      <div className="flex items-center justify-between gap-2 border-b border-admin-border bg-admin-card px-3.5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-black leading-tight text-admin-text">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: meta.bg, color: '#312338' }}><meta.icon size={14} aria-hidden="true" /></span> {estadoLabel(estado, t)}
        </h3>
        <span className="rounded-lg bg-admin-elevated px-2 py-1 text-xs font-black tabular-nums text-admin-text-secondary">
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
              type="button"
              aria-label={`Abrir pedido ${pedido.folio}`}
              onClick={() => onCardClick(pedido)}
              className="w-full text-left p-3 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-elevated hover:border-admin-border-soft transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-body font-bold text-sm text-admin-text">{pedido.folio}</p>
                <span className="rounded-md bg-admin-elevated px-1.5 py-0.5 text-xs font-bold tabular-nums text-admin-text-secondary">
                  {t('common.total')}: ${Number(pedido.total).toFixed(2)}
                </span>
              </div>
              <p className="text-xs font-body text-admin-muted truncate">{pedido.cliente_nombre}</p>
              <p className="text-xs font-body text-admin-muted truncate">{maskPhone(pedido.cliente_telefono)}</p>
              <div className="mt-1.5 text-xs font-semibold">
                <EntregaPedido tipo={pedido.tipo_entrega} sucursal={sucursalPorPedidoId.get(pedido.id)} />
              </div>
              <p className="text-[10px] font-body text-admin-inactive mt-1">{new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
