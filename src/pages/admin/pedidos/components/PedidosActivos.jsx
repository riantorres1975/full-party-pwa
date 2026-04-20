import { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAdminData } from '../../../../contexts/AdminDataContext';
import { useBreadcrumb } from '../../../../contexts/BreadcrumbContext';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADOS_ACTIVOS, estadoLabel } from '../../../../lib/estadoMeta';
import ColumnaKanban from './ColumnaKanban';
import TarjetaPedido from './TarjetaPedido';
import ModalDetallePedido from './ModalDetallePedido';

export default function PedidosActivos({ busquedaInput, setBusquedaInput, busquedaDebounced, setBusqueda }) {
  const { t } = useLanguage();
  const [pedidoModal, setPedidoModal] = useState(null);
  const {
    pedidos, setPedidos, loading,
    actualizando, filtroEstado, setFiltroEstado,
    busqueda, notificando,
    pedidosFiltrados, pedidosPorBusqueda, contadores,
    cambiarEstado, cancelarPedido, notificar,
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

      {/* Mobile: stacked sections by estado */}
      <div className="lg:hidden space-y-4 pb-6" aria-live="polite">
        {ESTADOS_ACTIVOS.map(estado => {
          const pedidosDelEstado = pedidosPorBusqueda.filter(p => p.estado === estado);
          return (
            <section key={estado} className="border border-admin-border rounded-lg overflow-hidden">
              {/* Estado header */}
              <div className="bg-admin-elevated px-4 py-3 border-b border-admin-border">
                <h3 className="text-xs font-body font-bold text-admin-muted uppercase tracking-wider">
                  {estadoLabel(estado, t)} · {pedidosDelEstado.length}
                </h3>
              </div>
              {/* Pedidos list */}
              <div className="p-3 space-y-2">
                {pedidosDelEstado.length === 0 ? (
                  <div className="py-6 text-center text-xs text-admin-muted">
                    Sin pedidos
                  </div>
                ) : (
                  pedidosDelEstado.map(pedido => (
                    <TarjetaPedido
                      key={pedido.id}
                      pedido={pedido}
                      onCambiarEstado={cambiarEstadoYFiltrar}
                      actualizando={actualizando}
                      notificando={notificando === pedido.id}
                      onNotificar={notificar}
                      onCancelar={cancelarPedido}
                      onPickingListo={(pedidoActualizado) => {
                        setPedidos(prev => prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p));
                        setFiltroEstado('Listo para Entrega');
                      }}
                      esDesktop={false}
                    />
                  ))
                )}
              </div>
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
