import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useAdminData } from '../../../../contexts/AdminDataContext';
import Can from '../../../../components/auth/Can';
import { DataTable } from '../../../../components/admin/DataTable';
import { useHistorialPedidos } from '../hooks/useHistorialPedidos';
import { maskPhone } from '../../../../utils/formatters';
import { ESTADO_META, estadoLabel } from '../../../../lib/estadoMeta';
import ModalDetallePedido from './ModalDetallePedido';

export default function PedidosHistorial() {
  const { t, lang } = useLanguage();
  const { pedidos, setPedidos, actualizando, notificando, cambiarEstado, cancelarPedido, notificar } = useAdminData();
  const [pedidoModal, setPedidoModal] = useState(null);

  const {
    filtered,
    estadoFiltro,
    setEstadoFiltro,
    rangoFecha,
    setRangoFecha,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    contadores,
  } = useHistorialPedidos(pedidos);

  const columnas = [
    {
      id: 'folio',
      label: t('admin.orders.orderNumber'),
      render: (pedido) => <span className="font-body font-bold">{pedido.folio}</span>,
      width: 100,
    },
    {
      id: 'cliente_nombre',
      label: t('common.customer'),
      render: (pedido) => <span className="font-body text-sm">{pedido.cliente_nombre}</span>,
    },
    {
      id: 'cliente_telefono',
      label: t('common.phone'),
      render: (pedido) => <span className="font-body text-sm text-admin-muted">{maskPhone(pedido.cliente_telefono)}</span>,
      width: 120,
    },
    {
      id: 'estado',
      label: t('admin.orders.status'),
      render: (pedido) => {
        const meta = ESTADO_META[pedido.estado];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-body font-bold ${meta.colorClass} ${meta.bgClass}`}>
            <meta.icon size={12} />
            {estadoLabel(pedido.estado, t)}
          </span>
        );
      },
      width: 130,
    },
    {
      id: 'total',
      label: t('common.total'),
      render: (pedido) => <span className="font-body font-bold text-right">${Number(pedido.total).toFixed(0)}</span>,
      width: 80,
      alignment: 'right',
    },
    {
      id: 'created_at',
      label: t('common.date'),
      render: (pedido) => {
        const fecha = new Date(pedido.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        return <span className="font-body text-xs text-admin-muted">{fecha}</span>;
      },
      width: 140,
    },
  ];

  const handleExportCSV = useCallback(() => {
    if (!filtered || filtered.length === 0) return;

    const headers = ['Folio', 'Cliente', 'Teléfono', 'Estado', 'Total', 'Fecha', 'Método de entrega'];
    const rows = filtered.map(p => [
      p.folio,
      p.cliente_nombre,
      p.cliente_telefono,
      estadoLabel(p.estado, t),
      Number(p.total).toFixed(2),
      new Date(p.created_at).toLocaleDateString('es-MX'),
      p.tipo_entrega === 'envio' ? 'Envío a domicilio' : 'Recogida en tienda',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [filtered, t]);

  return (
    <>
      {pedidoModal && (
        <ModalDetallePedido
          pedido={filtered.find(p => p.id === pedidoModal.id) ?? pedidoModal}
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

      {/* Filters */}
      <div className="bg-admin-card rounded-2xl border border-admin-border p-4 sm:p-5 space-y-4 shadow-card">
        {/* Estado pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEstadoFiltro('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-bold transition-all ${
              estadoFiltro === 'todos'
                ? 'bg-admin-text text-white'
                : 'bg-admin-border text-admin-text hover:bg-admin-border-soft'
            }`}
          >
            {t('common.all')} · {contadores.Enviado + contadores.Cancelado}
          </button>
          <button
            onClick={() => setEstadoFiltro('Enviado')}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-bold transition-all flex items-center gap-1.5 ${
              estadoFiltro === 'Enviado'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {t('admin.orders.sent')} · {contadores.Enviado}
          </button>
          <button
            onClick={() => setEstadoFiltro('Cancelado')}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-bold transition-all flex items-center gap-1.5 ${
              estadoFiltro === 'Cancelado'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('admin.orders.status.cancelled')} · {contadores.Cancelado}
          </button>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 7, label: '7d' },
            { value: 30, label: '30d' },
            { value: 90, label: '90d' },
            { value: 'all', label: t('admin.orders.filter.all') },
            { value: 'custom', label: t('admin.orders.filter.custom') },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setRangoFecha(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-bold transition-all ${
                rangoFecha === opt.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-admin-border text-admin-text hover:bg-admin-border-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {rangoFecha === 'custom' && (
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={fechaDesde ? new Date(fechaDesde).toISOString().split('T')[0] : ''}
              onChange={e => setFechaDesde(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-2 rounded-xl bg-admin-input border border-admin-border text-admin-text text-xs font-body focus:border-fiesta-magenta outline-none"
              placeholder={t('admin.orders.filter.dateFrom')}
            />
            <input
              type="date"
              value={fechaHasta ? new Date(fechaHasta).toISOString().split('T')[0] : ''}
              onChange={e => setFechaHasta(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-2 rounded-xl bg-admin-input border border-admin-border text-admin-text text-xs font-body focus:border-fiesta-magenta outline-none"
              placeholder={t('admin.orders.filter.dateTo')}
            />
          </div>
        )}

        {/* Export button */}
        <Can permission="reportes.export">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-body font-bold hover:bg-blue-600 disabled:bg-admin-border disabled:text-admin-muted transition-all active:scale-95"
          >
            <Download size={14} />
            {t('admin.orders.history.export')}
          </button>
        </Can>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columnas}
        data={filtered}
        loading={false}
        onRowClick={(pedido) => setPedidoModal(pedido)}
        emptyState={{
          title: t('admin.orders.history.empty.title'),
          description: t('admin.orders.history.empty.desc'),
        }}
      />
    </>
  );
}
