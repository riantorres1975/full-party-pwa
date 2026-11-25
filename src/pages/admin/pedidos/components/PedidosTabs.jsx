import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useAdminData } from '../../../../contexts/AdminDataContext';
import { ESTADOS_ACTIVOS, FILTRO_ESTADO_ACTIVO } from '../../../../lib/estadoMeta';
import PedidosActivos from './PedidosActivos';
import PedidosHistorial from './PedidosHistorial';
import ModalDetallePedido from './ModalDetallePedido';

export default function PedidosTabs() {
  const { t } = useLanguage();
  const { setBusqueda, contadores, pedidos, setPedidos, actualizando, notificando, cambiarEstado, notificar, cancelarPedido, confirmarPagoPedido } = useAdminData();
  const [params, setParams] = useSearchParams();
  const tabActivo = params.get('tab') === 'historial' ? 'historial' : 'activos';
  const busquedaInput = params.get('q') ?? '';
  const busquedaDebounced = useDebounce(busquedaInput, 300);
  const estadoVisible = ESTADOS_ACTIVOS.find(estado => FILTRO_ESTADO_ACTIVO[estado] === params.get('estado')) ?? 'todos';
  const folioDirecto = params.get('pedido');
  const pedidoDirecto = folioDirecto ? pedidos.find(pedido => pedido.folio === folioDirecto) : null;

  const activosCount =
    (contadores['Por Surtir'] || 0) +
    (contadores['Armando Pedido'] || 0) +
    (contadores['Listo para Entrega'] || 0);
  const historialCount = (contadores.Enviado || 0) + (contadores.Cancelado || 0);

  const cambiarParametro = (clave, valor) => {
    setParams(prev => {
      const siguiente = new URLSearchParams(prev);
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
      return siguiente;
    }, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      {pedidoDirecto && (
        <ModalDetallePedido
          pedido={pedidoDirecto}
          onClose={() => cambiarParametro('pedido', null)}
          onCambiarEstado={cambiarEstado}
          onNotificar={notificar}
          onCancelar={cancelarPedido}
          onConfirmarPago={confirmarPagoPedido}
          setPedidos={setPedidos}
          actualizando={actualizando}
          notificando={notificando}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-admin-border-soft overflow-x-auto py-3">
        <button
          type="button"
          onClick={() => cambiarParametro('tab', 'activos')}
          aria-pressed={tabActivo === 'activos'}
          className={`px-4 py-1 text-sm font-body font-bold whitespace-nowrap transition-all border-b-2 -mb-3 pb-2 ${
            tabActivo === 'activos'
              ? 'border-fiesta-magenta text-fiesta-magenta'
              : 'border-transparent text-admin-muted hover:text-admin-text'
          }`}
        >
          {t('admin.orders.tabs.active')} · {activosCount}
        </button>
        <button
          type="button"
          onClick={() => cambiarParametro('tab', 'historial')}
          aria-pressed={tabActivo === 'historial'}
          className={`px-4 py-1 text-sm font-body font-bold whitespace-nowrap transition-all border-b-2 -mb-3 pb-2 ${
            tabActivo === 'historial'
              ? 'border-fiesta-magenta text-fiesta-magenta'
              : 'border-transparent text-admin-muted hover:text-admin-text'
          }`}
        >
          {t('admin.orders.tabs.history')} · {historialCount}
        </button>
      </div>

      {/* Tab content */}
      {tabActivo === 'activos' && (
        <PedidosActivos
          busquedaInput={busquedaInput}
          setBusquedaInput={valor => cambiarParametro('q', valor)}
          busquedaDebounced={busquedaDebounced}
          setBusqueda={setBusqueda}
          estadoVisible={estadoVisible}
          setEstadoVisible={estado => cambiarParametro('estado', FILTRO_ESTADO_ACTIVO[estado])}
        />
      )}
      {tabActivo === 'historial' && <PedidosHistorial />}

      {/* Mobile padding */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
