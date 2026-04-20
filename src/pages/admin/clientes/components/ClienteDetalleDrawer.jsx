import { X, MessageCircle, Edit2 } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useEffect } from 'react';
import Can from '../../../../components/auth/Can';
import ClienteHistorialPedidos from './ClienteHistorialPedidos';

export default function ClienteDetalleDrawer({ cliente, abierto, onClose, pedidos, onPedidoClick }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [abierto, onClose]);

  if (!abierto || !cliente) return null;

  const clientePedidos = pedidos.filter(p =>
    p.cliente_telefono.replace(/[\s\-\(\)]/g, '') ===
    cliente.telefono.replace(/[\s\-\(\)]/g, '')
  );

  const ticketPromedio = clientePedidos.length > 0
    ? Math.round(cliente.gasto_total / clientePedidos.length)
    : 0;

  const handleWhatsApp = () => {
    const mensaje = encodeURIComponent(
      `Hola ${cliente.nombre}, tienes un pedido en Full Party. ¿Necesitas ayuda?`
    );
    window.open(
      `https://wa.me/${cliente.telefono.replace(/[\s\-\(\)]/g, '')}?text=${mensaje}`,
      '_blank'
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-96 bg-admin-card border-l border-admin-border shadow-elevated z-40 transform transition-transform duration-300 ${
          abierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-admin-border sticky top-0 bg-admin-card z-10">
          <h2 className="text-lg font-body font-bold text-admin-text">
            {cliente.nombre}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-admin-muted transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-4rem)] pb-20">
          {/* Cliente info */}
          <div className="p-4 border-b border-admin-border-soft space-y-3">
            <div>
              <p className="text-xs font-bold text-admin-text-secondary mb-1">
                {t('common.phone')}
              </p>
              <div className="flex items-center justify-between">
                <a
                  href={`tel:${cliente.telefono}`}
                  className="text-sm font-body text-ink-500 hover:underline"
                >
                  {cliente.telefono}
                </a>
                <button
                  onClick={handleWhatsApp}
                  className="p-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>

            {cliente.email && (
              <div>
                <p className="text-xs font-bold text-admin-text-secondary mb-1">
                  {t('common.email')}
                </p>
                <a
                  href={`mailto:${cliente.email}`}
                  className="text-sm font-body text-ink-500 hover:underline"
                >
                  {cliente.email}
                </a>
              </div>
            )}

            {cliente.metodo_entrega_preferido && (
              <div>
                <p className="text-xs font-bold text-admin-text-secondary mb-1">
                  {t('common.deliveryMethod')}
                </p>
                <p className="text-sm font-body text-admin-text">
                  {cliente.metodo_entrega_preferido}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 border-b border-admin-border-soft">
            <div className="bg-admin-elevated rounded p-3 text-center">
              <p className="text-2xl font-bold text-admin-text">
                {cliente.pedidos_total}
              </p>
              <p className="text-xs font-bold text-admin-text-secondary mt-1">
                {t('clientes.pedidos')}
              </p>
            </div>
            <div className="bg-admin-elevated rounded p-3 text-center">
              <p className="text-2xl font-bold text-admin-text">
                ${ticketPromedio.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-admin-text-secondary mt-1">
                {t('clientes.ticket_promedio')}
              </p>
            </div>
            <div className="bg-admin-elevated rounded p-3 text-center col-span-2">
              <p className="text-lg font-bold text-admin-text">
                ${cliente.gasto_total.toLocaleString('es-MX')}
              </p>
              <p className="text-xs font-bold text-admin-text-secondary mt-1">
                {t('clientes.gasto_total')}
              </p>
            </div>
            <div className="bg-admin-elevated rounded p-3 text-center text-xs col-span-2">
              <p className="text-admin-text">
                {t('clientes.cliente_desde')} {new Date(cliente.primer_pedido).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 p-4 border-b border-admin-border-soft">
            <Can permission="clientes.edit" fallback={null}>
              <button className="flex-1 px-3 py-2 rounded bg-admin-elevated text-admin-text font-bold text-sm hover:bg-admin-muted transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50" disabled>
                <Edit2 size={16} />
                {t('common.edit')}
              </button>
            </Can>
            <Can permission="pedidos.notify" fallback={null}>
              <button
                onClick={handleWhatsApp}
                className="flex-1 px-3 py-2 rounded bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors"
              >
                {t('clientes.send_message')}
              </button>
            </Can>
          </div>

          {/* Historial de pedidos */}
          <div className="p-4">
            <h3 className="text-sm font-body font-bold text-admin-text mb-3">
              {t('clientes.order_history')}
            </h3>
            <ClienteHistorialPedidos
              pedidos={clientePedidos}
              onRowClick={onPedidoClick}
            />
          </div>
        </div>
      </div>
    </>
  );
}
