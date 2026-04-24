import { Truck, Store, MessageCircle, CheckCircle, AlertCircle, Banknote, Smartphone, CreditCard, MoreHorizontal, ChevronRight } from 'lucide-react';
import { ESTADOS } from '../../../../hooks/usePedidosAdmin';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import { maskPhone } from '../../../../utils/formatters';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { useLanguage } from '../../../../hooks/useLanguage';
import Can from '../../../../components/auth/Can';

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
  actualizando,
  notificando,
  onCambiarEstado,
  onNotificar,
  onConfirmarPago,
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
    <div
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onTap()}
      className="w-full text-left bg-admin-card rounded-2xl border border-admin-border overflow-hidden transition-all active:scale-[0.98] shadow-card cursor-pointer"
      style={{ opacity: isLoading ? 0.6 : 1 }}
    >
      {/* Banda de color por estado */}
      <div className="h-1 w-full" style={{ background: meta.color }} />

      <div className="p-3 space-y-2.5">
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
            <div className="flex items-center gap-1.5 mt-0.5">
              {pedido.tipo_entrega === 'envio'
                ? <Truck size={11} className="text-admin-muted flex-shrink-0" />
                : <Store size={11} className="text-admin-muted flex-shrink-0" />
              }
              <span className="text-[11px] font-body text-admin-muted">{maskPhone(pedido.cliente_telefono)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="font-body font-black text-base" style={{ color: meta.color }}>
              {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(0)}
            </span>
            <ChevronRight size={14} className="text-admin-muted" />
          </div>
        </div>

        {/* Fila 3: acciones rápidas */}
        <div className="flex items-center gap-2 pt-0.5" onClick={e => e.stopPropagation()}>

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
                onClick={e => { e.stopPropagation(); onTap(); }}
                className="flex items-center gap-1 text-[11px] font-body font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95"
                style={{ background: '#d9770615', color: '#d97706', border: '1px solid #d9770633' }}
              >
                <AlertCircle size={11} />
                Confirmar pago
              </button>
            )
          )}

          {/* Notificar */}
          {pedido.estado !== 'Armando Pedido' && (
            <Can permission="pedidos.notify">
              <button
                onClick={() => !yaNotificado && !notificando && onNotificar(pedido)}
                disabled={yaNotificado || !!notificando}
                className="flex items-center gap-1 text-[11px] font-body font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
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
                className="ml-auto flex items-center gap-1 text-[11px] font-body font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{ background: meta.color }}
              >
                {isLoading
                  ? <span className="w-2.5 h-2.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />
                  : <meta.icon size={11} />
                }
                {estadoLabel(siguiente, t)}
              </button>
            </Can>
          )}
        </div>
      </div>
    </div>
  );
}
