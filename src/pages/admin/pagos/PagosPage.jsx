import { useState, useEffect, useMemo } from 'react';
import { CreditCard, CheckCircle, Clock, RefreshCw, Banknote, Smartphone, MoreHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAdminData } from '../../../contexts/AdminDataContext';
import PageHeader from '../../../components/admin/PageHeader';
import { DataTable } from '../../../components/admin/DataTable';
import ModalConfirmarPago from './ModalConfirmarPago';
import { usePagos } from './hooks/usePagos';
import { useConfirm } from '../../../hooks/useConfirm';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const FILTROS = ['todos', 'pendiente', 'confirmado'];
const PERIODOS = ['hoy', 'semana', 'mes', 'todo'];
const SEARCH_KEYS = ['folio', 'cliente_nombre', 'cliente_telefono'];

function getOption(params, key, options, fallback) {
  const value = params.get(key);
  return options.includes(value) ? value : fallback;
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

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
      {t(esConfirmado ? 'pagos.estado.confirmado' : 'pagos.estado.pendiente')}
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
  const { setPedidos } = useAdminData();
  const { pagos, loading, error, actualizando, refetch, confirmarPago, marcarPendiente } = usePagos();
  const [params, setParams] = useSearchParams();
  const filtro = getOption(params, 'filtro', FILTROS, 'todos');
  const periodo = getOption(params, 'periodo', PERIODOS, 'hoy');
  const changeOption = (key, value) => setParams(current => {
    const next = new URLSearchParams(current);
    next.set(key, value);
    return next;
  }, { replace: true });
  const [pedidoModal, setPedidoModal] = useState(null);
  const { isOpen, config, confirm, onConfirm, onCancel } = useConfirm();

  useEffect(() => {
    setBreadcrumb([t('admin.nav.payments')]);
  }, [t, setBreadcrumb]);

  const pagosPeriodo = useMemo(() => {
    const inicio = inicioDelPeriodo(periodo);
    if (!inicio) return pagos;
    return pagos.filter((p) => new Date(p.created_at) >= inicio);
  }, [pagos, periodo]);

  const stats = useMemo(() => {
    const pendientes = pagosPeriodo.filter(p => p.pago_estado !== 'confirmado');
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
    return base.filter(p => (p.pago_estado === 'confirmado' ? 'confirmado' : 'pendiente') === filtro);
  }, [pagosPeriodo, filtro]);

  const handleConfirmar = async ({ metodo_pago, notas }) => {
    if (!pedidoModal) return;
    const result = await confirmarPago(pedidoModal, { metodo_pago, notas });
    if (result.ok) {
      setPedidos(prev => prev.map(pedido => pedido.id === result.pedido.id ? { ...pedido, ...result.pedido } : pedido));
      toast.success(t('pagos.toast.confirmado'));
      setPedidoModal(null);
    } else {
      if (result.stale) setPedidoModal(null);
      toast.error(result.stale ? t('pagos.toast.stale') : (result.error || t('pagos.toast.error')));
    }
  };

  const handleMarcarPendiente = async (pedido) => {
    const accepted = await confirm({
      title: t('pagos.revertir.title'),
      message: t('pagos.revertir.message').replace('{folio}', pedido.folio || ''),
      confirmLabel: t('pagos.accion.pendiente'),
      variant: 'warning',
    });
    if (!accepted) return;

    const result = await marcarPendiente(pedido);
    if (result.ok) {
      setPedidos(prev => prev.map(pedido => pedido.id === result.pedido.id ? { ...pedido, ...result.pedido } : pedido));
      toast.success(t('pagos.toast.pendiente'));
    } else {
      toast.error(result.stale ? t('pagos.toast.stale') : (result.error || t('pagos.toast.error')));
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
      mobile: 'primary',
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
      mobile: 'action',
      label: '',
      sortable: false,
      align: 'right',
      render: (row) => {
        const isLoading = actualizando === row.id;
        if (row.pago_estado === 'confirmado') {
          return (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleMarcarPendiente(row); }}
              disabled={Boolean(actualizando)}
              className="min-h-10 rounded-lg border border-admin-border px-3 text-xs font-bold text-admin-text-secondary hover:bg-admin-elevated disabled:opacity-50"
            >
              {isLoading ? '…' : t('pagos.accion.pendiente')}
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPedidoModal(row); }}
            disabled={Boolean(actualizando)}
            className="min-h-10 rounded-lg bg-violet-700 px-3 text-xs font-bold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {isLoading ? '…' : t('pagos.accion.confirmar')}
          </button>
        );
      },
    },
  ];

  return (
    <div>
        <PageHeader
          title={t('pagos.title')}
          subtitle={t('pagos.subtitle')}
          actions={
            <button
              type="button"
              onClick={refetch}
              className="flex items-center gap-1.5 text-sm font-body text-admin-muted hover:text-admin-text border border-admin-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <RefreshCw size={14} />
              {t('pagos.refetch')}
            </button>
          }
        />

      {/* Selector de período */}
      <div className="flex items-center gap-2 mb-4">
        <div role="group" aria-label={t('pagos.periodLabel')} className="flex flex-wrap gap-1 rounded-xl border border-admin-border bg-admin-elevated p-1">
          {PERIODOS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => changeOption('periodo', p)}
              aria-pressed={periodo === p}
              className={`min-h-10 rounded-lg px-3 text-xs font-bold transition-colors ${
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

      <div className="mb-5 grid gap-3 min-[400px]:grid-cols-2">
        {[
          { key: 'pendiente', Icon: Clock, count: stats.pendientesCount, total: stats.pendientesTotal, label: 'pendientesCount' },
          { key: 'confirmado', Icon: CheckCircle, count: stats.confirmadosCount, total: stats.confirmadosTotal, label: 'confirmadosCount' },
        ].map(({ key, Icon, count, total, label }) => (
          <button key={key} type="button" onClick={() => changeOption('filtro', key)} aria-pressed={filtro === key} className={`flex items-start gap-3 rounded-2xl border bg-admin-card p-3.5 text-left hover:bg-admin-elevated sm:p-4 ${filtro === key ? 'border-violet-600 ring-1 ring-violet-600' : 'border-admin-border'}`}>
            <Icon size={19} aria-hidden="true" className="mt-1 shrink-0 text-admin-muted" />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-admin-muted">{t(`pagos.stat.${label}`)}</span>
              <strong className="block break-words text-lg tabular-nums text-admin-text sm:text-2xl">{loading || error ? '—' : currency.format(total)}</strong>
              {!loading && !error && <span className="block text-xs font-semibold text-admin-muted">{t('pagos.stat.orders', { count })}</span>}
            </span>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div role="group" aria-label={t('pagos.statusLabel')} className="mb-4 flex w-fit flex-wrap gap-1 rounded-xl border border-admin-border bg-admin-elevated p-1">
        {FILTROS.map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => changeOption('filtro', f)}
            aria-pressed={filtro === f}
            className={`min-h-10 rounded-lg px-3 text-sm font-bold transition-colors ${
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
        onRetry={refetch}
        columns={columns}
        rowKey="id"
        onRowClick={(row) => setPedidoModal(row)}
        isRowClickable={row => !actualizando && row.pago_estado !== 'confirmado'}
        searchable
        searchKeys={SEARCH_KEYS}
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
          onClose={() => { if (!actualizando) setPedidoModal(null); }}
          guardando={actualizando === pedidoModal.id}
        />
      )}

      <ConfirmModal
        open={isOpen}
        {...config}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

    </div>
  );
}
