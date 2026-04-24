import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import TarjetaPedido from './TarjetaPedido';

export default function ModalDetallePedido({ pedido, onClose, onCambiarEstado, actualizando, notificando, onNotificar, onPickingListo, onCancelar, onConfirmarPago, setPedidos, setFiltroEstado }) {
  const { t, lang } = useLanguage();
  const meta = ESTADO_META[pedido.estado] ?? ESTADO_META['Por Surtir'];
  const fecha = new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-admin-card rounded-2xl border border-admin-border shadow-elevated w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden">

        {/* Header con toda la info del pedido */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-admin-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-body font-black text-base text-admin-text flex-shrink-0">{pedido.folio}</span>
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
              className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TarjetaPedido
            key={pedido.id}
            pedido={pedido}
            onCambiarEstado={async (id, estado) => {
              await onCambiarEstado(id, estado);
              onClose();
            }}
            actualizando={actualizando}
            notificando={notificando === pedido.id}
            onNotificar={onNotificar}
            onCancelar={async (p) => { await onCancelar(p); onClose(); }}
            onConfirmarPago={onConfirmarPago}
            onPickingListo={(pedidoActualizado) => {
              setPedidos(prev => prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p));
              setFiltroEstado('Listo para Entrega');
              onClose();
            }}
            esDesktop={true}
            ocultarCabecera
          />
        </div>
      </div>
    </div>
  );
}
