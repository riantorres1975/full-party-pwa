import { useState, useEffect, useMemo } from 'react';
import { CreditCard, CheckCircle, Clock, RefreshCw, Banknote, Smartphone, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../components/ui/ToastProvider';
import PageHeader from '../../../components/admin/PageHeader';
import StatsCard from '../../../components/admin/StatsCard';
import { DataTable } from '../../../components/admin/DataTable';
import ModalConfirmarPago from './ModalConfirmarPago';
import { usePagos } from './hooks/usePagos';

const FILTROS = ['todos', 'pendiente', 'confirmado'];
const PERIODOS = ['hoy', 'semana', 'mes', 'todo'];

function inicioDelDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function inicioDelPeriodo(periodo) {
  const ahora = new Date();
  if (periodo === 'hoy') {
    return inicioDelDia();
  }
  if (periodo === 'semana') {
    const d = new Date(ahora);
    d.setDate(ahora.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === 'mes') {
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  }
  return null;
}

const METODO_ICONS = {
  transferencia: Smartphone,
  efectivo: Banknote,
  tarjeta: CreditCard,
  otro: MoreHorizontal,
};

function EstadoBadge({ estado }) {
  const { t } = useLanguage();
  const esConfirmado = estado === 'confirmado';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-bold"
      style={esConfirmado
        ? { background: '#16a34a22', color: '#16a34a', border: '1px solid #16a34a44' }
        : { background: '#d9770622', color: '#d97706', border: '1px solid #d9770644' }
      }
    >
      {esConfirmado ? <CheckCircle size={11} /> : <Clock size={11} />}
      {t(`pagos.estado.${estado}`)}
    </span>
  );
}

function MetodoBadge({ metodo }) {
  const { t } = useLanguage();
  if (!metodo) return <span className="text-admin-muted text-xs font-body">—</span>;
  const Icon = METODO_ICONS[metodo] || MoreHorizontal;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-body" style={{ color: 'var(--admin-text)' }}>
      <Icon size={13} style={{ color: 'var(--admin-muted)' }} />
      {t(`pagos.metodo.${metodo}`)}
    </span>
  );
}

export default function PagosPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const toast = useToast();
  const { pagos, loading, error, actualizando, refetch, confirmarPago, marcarPendiente } = usePagos();
  const [filtro, setFiltro] = useState('todos');
  const [periodo, setPeriodo] = useState('hoy');
  const [pedidoModal, setPedidoModal] = useState(null);

  useEffect(() => {
    setBreadcrumb([t('admin.nav.payments')]);
  }, [t, setBreadcrumb]);

  const pagosPeriodo = useMemo(() => {
    const inicio = inicioDelPeriodo(periodo);
    if (!inicio) return pagos;
    return pagos.filter((p) => new Date(p.created_at) >= inicio);
  }, [pagos, periodo]);

  const stats = useMemo(() => {
    const pendientes = pagosPeriodo.filter((p) => p.pago_estado === 'pendiente');
    const confirmados = pagosPeriodo.filter((p) => p.pago_estado === 'confirmado');
    return {
      pendientesCount: pendientes.length,
      pendientesTotal: pendientes.reduce((s, p) => s + Number(p.total), 0),
      confirmadosCount: confirmados.length,
      confirmadosTotal: confirmados.reduce((s, p) => s + Number(p.total), 0),
    };
  }, [pagosPeriodo]);

  const datosFiltrados = useMemo(() => {
    const base = pagosPeriodo;
    if (filtro === 'todos') return base;
    return base.filter((p) => p.pago_estado === filtro);
  }, [pagosPeriodo, filtro]);

  const handleConfirmar = async ({ metodo_pago, notas }) => {
    if (!pedidoModal) return;
    const result = await confirmarPago(pedidoModal.id, { metodo_pago, notas });
    if (result.ok) {
      toast.success(t('pagos.toast.confirmado'));
      setPedidoModal(null);
    } else {
      toast.error(result.error || t('pagos.toast.error'));
    }
  };

  const handleMarcarPendiente = async (pedido) => {
    const result = await marcarPendiente(pedido.id);
    if (result.ok) {
      toast.success(t('pagos.toast.pendiente'));
    } else {
      toast.error(result.error || t('pagos.toast.error'));
    }
  };

  const columns = [
    {
      key: 'folio',
      label: t('pagos.col.folio'),
      sortable: true,
      render: (row) => (
        <span className="font-body font-bold text-admin-text text-sm">{row.folio}</span>
      ),
    },
    {
      key: 'cliente_nombre',
      label: t('pagos.col.cliente'),
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-body text-admin-text">{row.cliente_nombre}</p>
          <p className="text-xs text-admin-muted">{row.cliente_telefono}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: t('pagos.col.total'),
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'metodo_pago',
      label: t('pagos.col.metodo'),
      sortable: false,
      render: (row) => <MetodoBadge metodo={row.metodo_pago} />,
    },
    {
      key: 'pago_estado',
      label: t('pagos.col.estado'),
      sortable: true,
      render: (row) => <EstadoBadge estado={row.pago_estado} />,
    },
    {
      key: 'created_at',
      label: t('pagos.col.fecha'),
      sortable: true,
      format: 'date',
      align: 'right',
    },
    {
      key: '_acciones',
      label: '',
      sortable: false,
      align: 'right',
      render: (row) => {
        const isLoading = actualizando === row.id;
        if (row.pago_estado === 'confirmado') {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleMarcarPendiente(row); }}
              disabled={isLoading}
              className="text-xs font-body text-admin-muted hover:text-admin-text border border-admin-border rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
            >
              {isLoading ? '…' : t('pagos.accion.pendiente')}
            </button>
          );
        }
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setPedidoModal(row); }}
            disabled={isLoading}
            className="text-xs font-body rounded-lg px-2.5 py-1 font-bold transition-colors disabled:opacity-50"
            style={{ color: '#16a34a', background: '#16a34a22', border: '1px solid #16a34a44' }}
          >
            {isLoading ? '…' : t('pagos.accion.confirmar')}
          </button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-admin-bg px-4 lg:px-6 py-4">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title={t('pagos.title')}
          subtitle={t('pagos.subtitle')}
          actions={
            <button
              onClick={refetch}
              className="flex items-center gap-1.5 text-sm font-body text-admin-muted hover:text-admin-text border border-admin-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <RefreshCw size={14} />
              {t('pagos.refetch')}
            </button>
          }
        />
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 p-1 bg-admin-elevated rounded-xl border border-admin-border">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-bold transition-all ${
                periodo === p
                  ? 'bg-admin-card text-admin-text shadow-sm'
                  : 'text-admin-muted hover:text-admin-text'
              }`}
            >
              {t(`pagos.periodo.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatsCard
          label={t('pagos.stat.pendientesCount')}
          value={stats.pendientesCount}
          icon={Clock}
          variant="warning"
          onClick={() => setFiltro('pendiente')}
        />
        <StatsCard
          label={t('pagos.stat.pendientesTotal')}
          value={`$${stats.pendientesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={CreditCard}
          variant="warning"
          onClick={() => setFiltro('pendiente')}
        />
        <StatsCard
          label={t('pagos.stat.confirmadosCount')}
          value={stats.confirmadosCount}
          icon={CheckCircle}
          variant="success"
          onClick={() => setFiltro('confirmado')}
        />
        <StatsCard
          label={t('pagos.stat.confirmadosTotal')}
          value={`$${stats.confirmadosTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={CheckCircle}
          variant="success"
          onClick={() => setFiltro('confirmado')}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-admin-elevated rounded-xl w-fit border border-admin-border">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-body font-bold transition-all ${
              filtro === f
                ? 'bg-admin-card text-admin-text shadow-sm'
                : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            {t(`pagos.filtro.${f}`)}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={datosFiltrados}
        loading={loading}
        error={error}
        columns={columns}
        rowKey="id"
        onRowClick={(row) => row.pago_estado === 'pendiente' && setPedidoModal(row)}
        searchable
        searchPlaceholder={t('pagos.buscar')}
        emptyState={{
          icon: CreditCard,
          title: t('pagos.vacio.titulo'),
          description: t('pagos.vacio.desc'),
        }}
        pagination={{ pageSize: 25 }}
      />

      {/* Modal confirmar pago */}
      {pedidoModal && (
        <ModalConfirmarPago
          pedido={pedidoModal}
          onConfirm={handleConfirmar}
          onClose={() => setPedidoModal(null)}
          guardando={actualizando === pedidoModal.id}
        />
      )}

      <div className="h-20 lg:h-0" />
    </div>
  );
}
