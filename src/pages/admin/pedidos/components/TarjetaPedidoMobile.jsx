import { MessageCircle, CheckCircle, AlertCircle, Banknote, Smartphone, CreditCard, MoreHorizontal, ChevronRight } from 'lucide-react';
import { ESTADOS } from '../../../../hooks/usePedidosAdmin';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import { maskPhone } from '../../../../utils/formatters';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { useLanguage } from '../../../../hooks/useLanguage';
import Can from '../../../../components/auth/Can';
import EntregaPedido from './EntregaPedido';

const METODOS_ICONO = {
  transferencia: Smartphone,
  efectivo: Banknote,
  tarjeta: CreditCard,
  otro: MoreHorizontal,
};

function tiempoRelativo(fechaStr, lang) {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return lang === 'en' ? `${min}m ago` : `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return lang === 'en' ? `${h}h ago` : `hace ${h}h`;
  const d = Math.floor(h / 24);
  return lang === 'en' ? `${d}d ago` : `hace ${d}d`;
}

export default function TarjetaPedidoMobile({
  pedido,
  sucursal,
  actualizando,
  notificando,
  onCambiarEstado,
  onNotificar,
  onTap,
}) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const isLoading = actualizando === pedido.id;
  const yaNotificado = pedido.notificado_estado === pedido.estado;
  const pagado = pedido.pago_estado === 'confirmado';

  const idxActual = ESTADOS.indexOf(pedido.estado);
  const siguiente = ESTADOS[idxActual + 1];
  const bloqueadoPorPago = siguiente === 'Enviado' && !pagado;

  const MetodoPagoIcon = pedido.metodo_pago ? (METODOS_ICONO[pedido.metodo_pago] || MoreHorizontal) : null;

  return (
    <article
      className="w-full bg-admin-card rounded-2xl border border-admin-border overflow-hidden shadow-card"
      style={{ opacity: isLoading ? 0.6 : 1 }}
    >
      {/* Banda de color por estado */}
      <div className="h-1 w-full" style={{ background: meta.color }} />

      <button
        type="button"
        onClick={onTap}
        aria-label={`Abrir pedido ${pedido.folio}`}
        className="block w-full space-y-2.5 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500"
      >
        {/* Fila 1: folio + tiempo + estado */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-body font-black text-sm text-admin-text">{pedido.folio}</span>
            <span className="text-[11px] font-body text-admin-muted flex-shrink-0">
              {tiempoRelativo(pedido.created_at, lang)}
            </span>
          </div>
          <span
            className="text-[11px] font-body font-bold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
            style={{ background: meta.bg, color: meta.color }}
          >
            <meta.icon size={10} />
            {estadoLabel(pedido.estado, t)}
          </span>
        </div>

        {/* Fila 2: cliente + entrega */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-body font-bold text-sm text-admin-text truncate">{pedido.cliente_nombre}</p>
            <p className="text-xs font-body text-admin-muted">{maskPhone(pedido.cliente_telefono)}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="font-body font-black text-base" style={{ color: meta.color }}>
              {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(2)}
            </span>
            <ChevronRight size={14} className="text-admin-muted" />
          </div>
        </div>

        <span className="block text-xs font-semibold">
          <EntregaPedido tipo={pedido.tipo_entrega} sucursal={sucursal} />
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-2 border-t border-admin-border-soft p-3">

          {/* Pago — solo en Listo para Entrega */}
          {pedido.estado === 'Listo para Entrega' && (
            pagado ? (
              <span
                className="flex items-center gap-1 text-[11px] font-body font-bold px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: '#16a34a15', color: '#16a34a', border: '1px solid #16a34a33' }}
              >
                <CheckCircle size={11} />
                {MetodoPagoIcon ? <MetodoPagoIcon size={11} /> : null}
                Pagado
              </span>
            ) : (
              <button
                type="button"
                onClick={onTap}
                className="flex items-center gap-1 min-h-10 text-xs font-body font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95"
                style={{ background: '#d9770615', color: '#d97706', border: '1px solid #d9770633' }}
              >
                <AlertCircle size={11} />
                Confirmar pago
              </button>
            )
          )}

          {pedido.estado === 'Armando Pedido' && (
            <button type="button" onClick={onTap} className="min-h-10 rounded-lg bg-violet-700 px-3 text-xs font-black text-white">
              Continuar surtido
            </button>
          )}

          {/* Notificar */}
          {pedido.estado !== 'Armando Pedido' && (
            <Can permission="pedidos.notify">
              <button
                onClick={() => !yaNotificado && !notificando && onNotificar(pedido)}
                disabled={yaNotificado || !!notificando}
                className="flex items-center gap-1 min-h-10 text-xs font-body font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
                style={yaNotificado
                  ? { background: '#d1fae5', color: '#6ee7b7' }
                  : { background: 'linear-gradient(135deg, #25D366, #1db954)', color: 'white' }
                }
              >
                {notificando === pedido.id
                  ? <span className="w-2.5 h-2.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />
                  : <MessageCircle size={11} />
                }
                {yaNotificado ? 'Notificado' : 'Notificar'}
              </button>
            </Can>
          )}

          {/* Avanzar estado */}
          {siguiente && pedido.estado !== 'Armando Pedido' && (
            <Can permission="pedidos.edit">
              <button
                onClick={() => !bloqueadoPorPago && onCambiarEstado(pedido.id, siguiente)}
                disabled={isLoading || bloqueadoPorPago}
                title={bloqueadoPorPago ? 'Confirma el pago primero' : undefined}
                className="ml-auto flex items-center gap-1 min-h-10 text-xs font-body font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-violet-700 text-white"
              >
                {isLoading
                  ? <span className="w-2.5 h-2.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />
                  : <meta.icon size={11} />
                }
                {pedido.estado === 'Por Surtir' ? 'Empezar a surtir' : pedido.tipo_entrega === 'envio' ? 'Marcar como enviado' : 'Registrar entrega'}
              </button>
            </Can>
          )}
      </div>
    </article>
  );
}
