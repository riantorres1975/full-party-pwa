import { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAdminData } from '../../../../contexts/AdminDataContext';
import { useBreadcrumb } from '../../../../contexts/BreadcrumbContext';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADOS_ACTIVOS, ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import ColumnaKanban from './ColumnaKanban';
import TarjetaPedido from './TarjetaPedido';
import TarjetaPedidoMobile from './TarjetaPedidoMobile';
import ModalDetallePedido from './ModalDetallePedido';

export default function PedidosActivos({ busquedaInput, setBusquedaInput, busquedaDebounced, setBusqueda }) {
  const { t } = useLanguage();
  const [pedidoModal, setPedidoModal] = useState(null);
  const {
    setPedidos,
    actualizando,
    setFiltroEstado,
    notificando,
    pedidosPorBusqueda,
    cambiarEstado, cancelarPedido, notificar, confirmarPagoPedido,
  } = useAdminData();

  useEffect(() => { setBusqueda(busquedaDebounced); }, [busquedaDebounced, setBusqueda]);

  const setBreadcrumb = useBreadcrumb();
  useEffect(() => {
    setBreadcrumb([t('admin.nav.orders')]);
  }, [t, setBreadcrumb]);

  const cambiarEstadoYFiltrar = useCallback(async (pedidoId, nuevoEstado) => {
    await cambiarEstado(pedidoId, nuevoEstado);
  }, [cambiarEstado]);

  return (
    <>
      {pedidoModal && (
        <ModalDetallePedido
          pedido={pedidosPorBusqueda.find(p => p.id === pedidoModal.id) ?? pedidoModal}
          onClose={() => setPedidoModal(null)}
          onCambiarEstado={cambiarEstadoYFiltrar}
          actualizando={actualizando}
          notificando={notificando}
          onNotificar={notificar}
          onCancelar={cancelarPedido}
          onConfirmarPago={confirmarPagoPedido}
          setPedidos={setPedidos}
          setFiltroEstado={setFiltroEstado}
        />
      )}

      {/* Barra de búsqueda */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
        <input
          type="text"
          value={busquedaInput}
          onChange={e => setBusquedaInput(e.target.value)}
          placeholder={t('admin.orders.searchPlaceholder')}
          className="w-full bg-admin-input rounded-2xl lg:rounded-xl pl-9 pr-9 py-3 lg:py-2.5 text-sm font-body font-semibold
                     text-admin-text placeholder:text-admin-inactive outline-none border-2
                     border-admin-border focus:border-fiesta-magenta transition-colors"
        />
        {busquedaInput && (
          <button
            type="button"
            onClick={() => setBusquedaInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-inactive hover:text-admin-muted"
            aria-label={t('admin.orders.clearSearch')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile: secciones compactas por estado */}
      <div className="lg:hidden space-y-3 pb-6" aria-live="polite">
        {ESTADOS_ACTIVOS.map(estado => {
          const meta = ESTADO_META[estado];
          const pedidosDelEstado = pedidosPorBusqueda.filter(p => p.estado === estado);
          return (
            <section key={estado}>
              {/* Header con color del estado */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
                style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}
              >
                <h3 className="text-xs font-body font-black flex items-center gap-1.5" style={{ color: meta.color }}>
                  <meta.icon size={13} />
                  {estadoLabel(estado, t)}
                </h3>
                <span
                  className="text-xs font-body font-black px-2 py-0.5 rounded-full"
                  style={{ background: meta.color, color: 'white' }}
                >
                  {pedidosDelEstado.length}
                </span>
              </div>

              {pedidosDelEstado.length === 0 ? (
                <p className="text-center text-xs text-admin-muted py-3">{t('common.noOrders')}</p>
              ) : (
                <div className="space-y-2">
                  {pedidosDelEstado.map(pedido => (
                    <TarjetaPedidoMobile
                      key={pedido.id}
                      pedido={pedido}
                      actualizando={actualizando}
                      notificando={notificando}
                      onCambiarEstado={cambiarEstadoYFiltrar}
                      onNotificar={notificar}
                      onConfirmarPago={confirmarPagoPedido}
                      onTap={() => setPedidoModal(pedido)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Desktop Kanban */}
      <div className="hidden lg:grid grid-cols-3 gap-3 pb-2" style={{ height: 'calc(100dvh - 380px)', minHeight: 200 }}>
        {ESTADOS_ACTIVOS.map(estado => (
          <ColumnaKanban
            key={estado}
            estado={estado}
            pedidos={pedidosPorBusqueda.filter(p => p.estado === estado)}
            onCardClick={setPedidoModal}
          />
        ))}
      </div>
    </>
  );
}
