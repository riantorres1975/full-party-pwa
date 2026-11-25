import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../../../hooks/useFocusTrap.js';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import TarjetaPedido from './TarjetaPedido';

export default function ModalDetallePedido({ pedido, onClose, onCambiarEstado, actualizando, notificando, onNotificar, onCancelar, onConfirmarPago, setPedidos }) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha = new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const estadoAnterior = useRef(pedido.estado);
  const titleId = useId();
  useFocusTrap(panelRef, true, 'first', onClose);

  useEffect(() => {
    if (estadoAnterior.current === pedido.estado) return;
    estadoAnterior.current = pedido.estado;
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    panelRef.current?.focus({ preventScroll: true });
  }, [pedido.estado]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="bg-admin-card rounded-2xl border border-admin-border shadow-elevated w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden">

        {/* Header con toda la info del pedido */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-admin-border flex-shrink-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
            <h2 id={titleId} className="font-body font-black text-base text-admin-text">{pedido.folio}</h2>
            <span className="text-xs font-body text-admin-muted flex-shrink-0">{fecha}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="font-body font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs"
              style={{ background: meta.bg, color: meta.color }}
            >
              <meta.icon size={13} strokeWidth={2.5} />
              {estadoLabel(pedido.estado, t)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar pedido"
              className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
          <TarjetaPedido
            key={pedido.id}
            pedido={pedido}
            onCambiarEstado={async (id, estado) => {
              const actualizado = await onCambiarEstado(id, estado);
              if (actualizado && estado === 'Enviado') onClose();
              return actualizado;
            }}
            actualizando={actualizando}
            notificando={notificando === pedido.id}
            onNotificar={onNotificar}
            onCancelar={async (p) => { if (await onCancelar(p)) onClose(); }}
            onConfirmarPago={onConfirmarPago}
            onPickingListo={(pedidoActualizado) => {
              setPedidos(prev => prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p));
            }}
            esDesktop={true}
            ocultarCabecera
          />
        </div>
      </div>
    </div>
  );
}
