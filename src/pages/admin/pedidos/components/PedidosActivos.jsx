import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAdminData } from '../../../../contexts/AdminDataContext';
import { useBreadcrumb } from '../../../../contexts/BreadcrumbContext';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADOS_ACTIVOS, estadoLabel } from '../../../../lib/estadoMeta';
import ColumnaKanban from './ColumnaKanban';
import TarjetaPedidoMobile from './TarjetaPedidoMobile';
import ModalDetallePedido from './ModalDetallePedido';

export default function PedidosActivos({ busquedaInput, setBusquedaInput, busquedaDebounced, setBusqueda, estadoVisible, setEstadoVisible }) {
  const { t } = useLanguage();
  const [pedidoModal, setPedidoModal] = useState(null);
  const [sucursalVisible, setSucursalVisible] = useState('todas');
  const {
    setPedidos,
    actualizando,
    notificando,
    pedidos, pedidosPorBusqueda,
    sucursalesPedidos, sucursalPorPedidoId,
    cambiarEstado, cancelarPedido, notificar, confirmarPagoPedido,
  } = useAdminData();

  useEffect(() => { setBusqueda(busquedaDebounced); }, [busquedaDebounced, setBusqueda]);

  const setBreadcrumb = useBreadcrumb();
  useEffect(() => {
    setBreadcrumb([t('admin.nav.orders')]);
  }, [t, setBreadcrumb]);

  const pedidosPorEstado = useMemo(() => {
    const pedidosVisibles = sucursalVisible === 'todas' ? pedidosPorBusqueda : pedidosPorBusqueda.filter(pedido => (
      (sucursalPorPedidoId.get(pedido.id)?.id ?? 'sin-sucursal') === sucursalVisible
    ));
    return Object.fromEntries(ESTADOS_ACTIVOS.map(estado => [estado, pedidosVisibles.filter(p => p.estado === estado)]));
  }, [pedidosPorBusqueda, sucursalPorPedidoId, sucursalVisible]);
  const estadosVisibles = estadoVisible === 'todos' ? ESTADOS_ACTIVOS : [estadoVisible];
  const activos = ESTADOS_ACTIVOS.reduce((total, estado) => total + pedidosPorEstado[estado].length, 0);
  const hayResultados = estadosVisibles.some(estado => pedidosPorEstado[estado].length > 0);

  const avanzarDesdeTarjeta = async (id, estado) => {
    const pedido = pedidos.find(item => item.id === id);
    if (pedido && estado === 'Armando Pedido') setPedidoModal(pedido);
    return cambiarEstado(id, estado);
  };

  return (
    <>
      {pedidoModal && (
        <ModalDetallePedido
          pedido={pedidos.find(p => p.id === pedidoModal.id) ?? pedidoModal}
          onClose={() => setPedidoModal(null)}
          onCambiarEstado={cambiarEstado}
          actualizando={actualizando}
          notificando={notificando}
          onNotificar={notificar}
          onCancelar={cancelarPedido}
          onConfirmarPago={confirmarPagoPedido}
          setPedidos={setPedidos}
        />
      )}

      {/* Barra de búsqueda */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            type="search"
            aria-label={t('admin.orders.searchPlaceholder')}
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
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {sucursalesPedidos.length > 0 && (
          <select
            aria-label={t('admin.orders.branchFilter')}
            value={sucursalVisible}
            onChange={event => setSucursalVisible(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-admin-border bg-admin-input px-3 py-2 text-sm font-bold text-admin-text focus:border-fiesta-magenta focus:outline-none"
          >
            <option value="todas">{t('admin.orders.allBranches')}</option>
            {sucursalesPedidos.map(sucursal => <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>)}
            <option value="sin-sucursal">{t('admin.orders.unassignedBranch')}</option>
          </select>
        )}
      </div>

      <div role="group" aria-label="Filtrar pedidos por estado" className="mb-4 flex flex-wrap gap-2">
        {['todos', ...ESTADOS_ACTIVOS].map((estado) => {
          const activo = estadoVisible === estado;
          const cantidad = estado === 'todos' ? activos : pedidosPorEstado[estado].length;
          return (
            <button
              type="button"
              key={estado}
              onClick={() => setEstadoVisible(estado)}
              aria-pressed={activo}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${activo
                ? 'border-violet-600 bg-violet-700 text-white'
                : 'border-admin-border bg-admin-card text-admin-text hover:bg-admin-elevated'}`}
            >
              {estado === 'todos' ? t('common.all') : estadoLabel(estado, t)}
              <span className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${activo ? 'bg-white/20' : 'bg-admin-elevated text-admin-muted'}`}>{cantidad}</span>
            </button>
          );
        })}
      </div>

      {!hayResultados ? (
        <div className="rounded-2xl border border-dashed border-admin-border bg-admin-card px-5 py-8 text-center" role="status">
          <p className="font-bold text-admin-text">{t('common.noOrders')}</p>
          {busquedaInput && <button type="button" className="mt-2 min-h-11 px-3 text-sm font-bold text-admin-text underline" onClick={() => setBusquedaInput('')}>{t('admin.orders.clearSearch')}</button>}
          {sucursalVisible !== 'todas' && <button type="button" className="mt-2 min-h-11 px-3 text-sm font-bold text-admin-text underline" onClick={() => setSucursalVisible('todas')}>{t('admin.orders.allBranches')}</button>}
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-4 pb-6">
            {estadosVisibles.filter(estado => pedidosPorEstado[estado].length).map((estado) => (
              <section key={estado}>
                <h3 className="mb-2 text-sm font-black text-admin-text">{estadoLabel(estado, t)}</h3>
                <div className="space-y-2">
                  {pedidosPorEstado[estado].map(pedido => (
                    <TarjetaPedidoMobile
                      key={pedido.id}
                      pedido={pedido}
                      sucursal={sucursalPorPedidoId.get(pedido.id)}
                      actualizando={actualizando}
                      notificando={notificando}
                      onCambiarEstado={avanzarDesdeTarjeta}
                      onNotificar={notificar}
                      onTap={() => setPedidoModal(pedido)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className={`hidden gap-3 pb-2 lg:grid ${estadosVisibles.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {estadosVisibles.map(estado => (
              <ColumnaKanban
                key={estado}
                estado={estado}
                pedidos={pedidosPorEstado[estado]}
                sucursalPorPedidoId={sucursalPorPedidoId}
                onCardClick={setPedidoModal}
              />
            ))}
          </div>
        </>
      )}

    </>
  );
}
