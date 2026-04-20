import { useState } from 'react';
import { MessageCircle, Copy, Check, Phone, Truck, Store, MapPin, XCircle } from 'lucide-react';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADOS } from '../../../../hooks/usePedidosAdmin';
import { maskPhone } from '../../../../utils/formatters';
import Can from '../../../../components/auth/Can';
import ListaArticulos from './ListaArticulos';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';

export default function TarjetaPedido({ pedido, onCambiarEstado, actualizando, notificando, onNotificar, onPickingListo, onCancelar, esDesktop }) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha = new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const esActualizando = actualizando === pedido.id;
  const yaNotificado = pedido.notificado_estado === pedido.estado;
  const [totalPicking, setTotalPicking] = useState(null);
  const [copiado, setCopiado] = useState(false);

  function copiarDatosEnvio() {
    const total = (totalPicking !== null ? totalPicking : Number(pedido.total)).toFixed(2);
    const texto =
      `📦 Datos de entrega\n` +
      `Cliente: ${pedido.cliente_nombre}\n` +
      `Tel: ${pedido.cliente_telefono}\n` +
      `Dirección: ${pedido.direccion || 'No especificada'}\n` +
      `Total a cobrar: $${total}`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <div
      className="bg-admin-card rounded-2xl p-5 transition-all duration-300 border border-admin-border shadow-card"
      style={{ opacity: esActualizando ? 0.6 : 1 }}
    >
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-admin-border-soft">
        <div className="flex items-center gap-3">
          <span className="font-body font-bold text-base text-admin-text">{pedido.folio}</span>
          <p className="text-xs font-body text-admin-muted">{fecha}</p>
        </div>
        <span className={`font-body font-bold px-3 py-1.5 rounded-full flex-shrink-0 flex items-center gap-1.5 text-sm ${meta.bgClass} ${meta.colorClass}`}>
          <meta.icon size={16} strokeWidth={2.5} /> {estadoLabel(pedido.estado, t)}
        </span>
      </div>

      <div className="space-y-1.5 pb-4 mb-4 border-b border-admin-border-soft">
        <p className="font-body font-bold text-base text-admin-text">{pedido.cliente_nombre}</p>
        <p className="flex items-center gap-1.5 font-body text-admin-muted text-sm"><Phone size={14} /> {maskPhone(pedido.cliente_telefono)}</p>
        <p className="flex items-center gap-1.5 font-body text-admin-muted text-sm">
          {pedido.tipo_entrega === 'envio' ? <><Truck size={14} /> {t('cart.deliveryHome')}</> : <><Store size={14} /> {t('cart.pickupStore')}</>}
        </p>
        {pedido.direccion && (
          <p className="flex items-center gap-1.5 font-body text-admin-muted text-sm leading-relaxed"><MapPin size={14} /> {pedido.direccion}</p>
        )}
      </div>

      {pedido.detalles_json?.length > 0 && (
        <ListaArticulos
          items={pedido.detalles_json}
          meta={meta}
          estadoPedido={pedido.estado}
          pedido={pedido}
          onPickingListo={onPickingListo}
          onTotalChange={setTotalPicking}
          esDesktop={true}
        />
      )}

      <div className="flex items-center justify-between gap-3 pb-4 border-b border-admin-border-soft">
        <span className="font-body text-admin-muted font-bold text-sm">{t('common.total')}</span>
        <span className="font-body font-black text-2xl" style={{ color: meta.color }}>
          {SIMBOLO_MONEDA}{(totalPicking !== null && pedido.estado === 'Armando Pedido' ? totalPicking : Number(pedido.total)).toFixed(2)}
        </span>
      </div>

      {pedido.estado === 'Listo para Entrega' && pedido.tipo_entrega === 'envio' && (
        <button
          onClick={copiarDatosEnvio}
          className={`w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-bold transition-all duration-200 active:scale-95 border-2 ${
            copiado
              ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
              : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {copiado ? <Check size={15} /> : <Copy size={15} />}
          {copiado ? 'Datos copiados' : 'Copiar datos para repartidor'}
        </button>
      )}

      <div className="relative mb-3">
        {esActualizando && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl bg-admin-card/80">
            <div className="w-4 h-4 rounded-full border-2 border-ink-200 border-t-ink-600 animate-spin" />
          </div>
        )}
        {(() => {
          const idxActual = ESTADOS.indexOf(pedido.estado);
          const siguiente = ESTADOS[idxActual + 1];
          if (!siguiente || pedido.estado === 'Armando Pedido') return null;
          const m = ESTADO_META[siguiente];
          return (
            <Can permission="pedidos.edit">
              <button
                onClick={() => onCambiarEstado(pedido.id, siguiente)}
                disabled={esActualizando}
                className="w-full py-2.5 px-5 rounded-xl text-sm font-body font-bold whitespace-nowrap transition-all duration-200 active:scale-95 disabled:cursor-default text-white flex items-center justify-center gap-2"
                style={m.activeStyle}
              >
                <m.icon size={14} strokeWidth={2.5} />
                <span>{t('admin.orders.moveTo', { status: estadoLabel(siguiente, t) })}</span>
              </button>
            </Can>
          );
        })()}
      </div>

      <div className="flex items-center gap-2">
        {pedido.estado !== 'Cancelado' && (
          <Can permission="pedidos.cancel">
            <button
              onClick={() => onCancelar(pedido)}
              disabled={esActualizando}
              className="flex items-center justify-center gap-1.5 rounded-xl font-body font-bold
                         transition-all duration-200 active:scale-95 disabled:opacity-50
                         bg-red-500/10 border border-red-400/30 text-red-400
                         hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-300
                         py-2 px-4 text-xs flex-1"
            >
              <XCircle size={16} />
              {t('admin.orders.cancelOrder')}
            </button>
          </Can>
        )}

        {pedido.estado === 'Cancelado' && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-body font-bold flex-1"
               style={{ background: '#f3f4f6', color: '#6b7280' }}>
            <XCircle size={14} />
            {t('admin.orders.cancelledOrder')}
          </div>
        )}

        {pedido.estado !== 'Armando Pedido' && (
          <Can permission="pedidos.notify">
            <button
              onClick={() => !yaNotificado && !notificando && onNotificar(pedido)}
              disabled={yaNotificado || notificando}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-black text-white
                         transition-all duration-200 active:scale-95 disabled:cursor-not-allowed flex-1"
              style={yaNotificado
                ? { background: '#d1fae5', color: '#6ee7b7', boxShadow: 'none' }
                : { background: 'linear-gradient(135deg, #25D366, #1db954)', boxShadow: '0 3px 12px #25D36633' }
              }
            >
              {notificando
                ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                : <MessageCircle size={16} />
              }
              {yaNotificado ? t('admin.orders.clientNotified') : notificando ? t('cart.sendingOrder') : t('admin.orders.notifyCustomer')}
            </button>
          </Can>
        )}
      </div>
    </div>
  );
}
