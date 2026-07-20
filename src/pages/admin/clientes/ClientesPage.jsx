import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PageHeader from '../../../components/admin/PageHeader';
import { DataTable } from '../../../components/admin/DataTable';
import ClienteDetalleDrawer from './components/ClienteDetalleDrawer';
import ModalDetallePedido from '../pedidos/components/ModalDetallePedido';
import { useClientes } from './hooks/useClientes';

function normalizarTelefono(telefono = '') {
  return telefono.replace(/\D/g, '');
}

export default function ClientesPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const {
    pedidos,
    setPedidos,
    actualizando,
    notificando,
    cambiarEstado,
    cancelarPedido,
    notificar,
  } = useAdminData();
  const { clientes, loading, error, refetch: refetchClientes } = useClientes();
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [pedidoModal, setPedidoModal] = useState(null);

  useEffect(() => {
    setBreadcrumb([t('admin.nav.clients')]);
  }, [t, setBreadcrumb]);

  const handlePedidoClick = (pedido) => {
    setPedidoModal(pedido);
  };

  const handleClienteUpdated = ({ pedidoIds, nombre, telefono }) => {
    const ids = new Set(pedidoIds);
    setPedidos((prev) => prev.map((pedido) => (
      ids.has(pedido.id)
        ? {
            ...pedido,
            cliente_nombre: nombre,
            cliente_telefono: telefono,
          }
        : pedido
    )));

    setClienteSeleccionado((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        id: normalizarTelefono(telefono),
        nombre,
        telefono,
      };
    });

    refetchClientes();
  };

  const columns = [
    {
      key: 'nombre',
      label: t('clientes.nombre'),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.nombre?.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{row.nombre}</span>
        </div>
      ),
    },
    {
      key: 'telefono',
      label: t('clientes.telefono'),
      sortable: false,
    },
    {
      key: 'pedidos_total',
      label: t('clientes.pedidos'),
      sortable: true,
      align: 'right',
    },
    {
      key: 'gasto_total',
      label: t('clientes.gasto_total'),
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'ultimo_pedido',
      label: t('clientes.ultimo_pedido'),
      sortable: true,
      format: 'date',
      align: 'right',
    },
  ];

  return (
    <div className="min-h-screen bg-admin-bg px-4 lg:px-6 py-4">
      <div className="mb-6">
        <PageHeader
          title={t('clientes.title')}
          subtitle={t('clientes.subtitle')}
        />
      </div>

      <div className="mb-8">
        <DataTable
          data={clientes}
          loading={loading}
          error={error}
          onRetry={refetchClientes}
          columns={columns}
          rowKey="id"
          onRowClick={(row) => setClienteSeleccionado(row)}
          searchable
          searchPlaceholder={t('clientes.buscar')}
          emptyState={{
            icon: Users,
            title: t('clientes.vacio.titulo'),
            description: t('clientes.vacio.desc'),
          }}
          pagination={{ pageSize: 25 }}
        />
      </div>

      {/* Drawer con detalle del cliente */}
      <ClienteDetalleDrawer
        cliente={clienteSeleccionado}
        abierto={!!clienteSeleccionado}
        onClose={() => setClienteSeleccionado(null)}
        pedidos={pedidos}
        onPedidoClick={handlePedidoClick}
        onClienteUpdated={handleClienteUpdated}
      />

      {pedidoModal && (
        <ModalDetallePedido
          pedido={pedidos.find(p => p.id === pedidoModal.id) ?? pedidoModal}
          onClose={() => setPedidoModal(null)}
          onCambiarEstado={async (pedidoId, nuevoEstado) => {
            await cambiarEstado(pedidoId, nuevoEstado);
          }}
          actualizando={actualizando}
          notificando={notificando}
          onNotificar={notificar}
          onCancelar={cancelarPedido}
          setPedidos={setPedidos}
          setFiltroEstado={() => {}}
        />
      )}

      {/* Footer spacing en mobile */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}
