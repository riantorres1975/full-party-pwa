import { useEffect } from 'react';
import { X } from 'lucide-react';
import TarjetaPedido from './TarjetaPedido';

export default function ModalDetallePedido({ pedido, onClose, onCambiarEstado, actualizando, notificando, onNotificar, onPickingListo, onCancelar, setPedidos, setFiltroEstado }) {
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border flex-shrink-0">
          <p className="font-body font-bold text-base text-admin-text">{pedido.folio}</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
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
            onPickingListo={(pedidoActualizado) => {
              setPedidos(prev => prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p));
              setFiltroEstado('Listo para Entrega');
              onClose();
            }}
            esDesktop={true}
          />
        </div>
      </div>
    </div>
  );
}
