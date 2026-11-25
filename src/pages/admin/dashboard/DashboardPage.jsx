import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { ESTADOS_HISTORIAL } from '../../../lib/estadoMeta';
import DataErrorState from '../../../components/admin/DataErrorState';
import PageHeader from '../../../components/admin/PageHeader';
import RangoPeriodoPicker from './components/RangoPeriodoPicker';
import KpiGrid from './components/KpiGrid';
import VentasChart from './components/VentasChart';
import PedidosPorEstadoChart from './components/PedidosPorEstadoChart';
import TopProductos from './components/TopProductos';
import UltimosPedidos from './components/UltimosPedidos';
import PrioridadesOperativas from './components/PrioridadesOperativas';
import { useDashboardData } from './hooks/useDashboardData';
import { calcularPrioridades } from './dashboardPriorities';

function getDefaultDates() {
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date();
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const setBreadcrumb = useBreadcrumb();
  const { pedidos, contadores, loading: pedidosLoading, error: pedidosError } = useAdminData();
  const [periodo, setPeriodo] = useState('today');
  const [fechas, setFechas] = useState(getDefaultDates);
  const canViewOrders = can('pedidos.view');

  useEffect(() => {
    setBreadcrumb([t('admin.nav.dashboard')]);
  }, [t, setBreadcrumb]);

  const { kpis, kpisAnterior, ventasDiarias, pedidosPorEstado, topProductos, ultimosPedidos, stockAlerts, loading, error, refetch } = useDashboardData(fechas);
  const prioridades = useMemo(() => calcularPrioridades(pedidos, stockAlerts ?? {}), [pedidos, stockAlerts]);

  const handleChangePeriodo = (newPeriodo, desde, hasta) => {
    setPeriodo(newPeriodo);
    setFechas({ desde, hasta });
  };

  const rutaPedido = (pedido) => {
    const tab = ESTADOS_HISTORIAL.includes(pedido.estado) ? 'historial' : 'activos';
    const params = new URLSearchParams({ tab });
    if (pedido.folio) params.set('pedido', pedido.folio);
    return `/admin/pedidos?${params}`;
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 pb-6 sm:space-y-6">
      <PageHeader accent title={t('admin.dashboard.title')} subtitle={t('admin.dashboard.subtitle')} actions={can('catalogo.edit') && (
          <Link
            to="/admin/catalogo?nuevo=1"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white transition-colors hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <Plus size={18} aria-hidden="true" /> {t('admin.dashboard.newProduct')}
          </Link>
        )} />

      <PrioridadesOperativas
        contadores={contadores}
        prioridades={prioridades}
        pedidosLoading={pedidosLoading}
        pedidosError={pedidosError}
        stockLoading={loading}
        stockAvailable={Boolean(stockAlerts)}
        showOrders={canViewOrders}
        showPayments={can('pagos.view')}
        showInventory={can('catalogo.view')}
      />

      <section aria-labelledby="dashboard-period-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="dashboard-period-title" className="text-lg font-black text-admin-text sm:text-xl">{t('admin.dashboard.periodSummary')}</h2>
          <RangoPeriodoPicker periodo={periodo} onChangePeriodo={handleChangePeriodo} />
        </div>
        {error ? (
          <DataErrorState message={t('admin.dashboard.error')} onRetry={refetch} compact />
        ) : (
          <>
            <KpiGrid kpis={kpis} kpisAnterior={kpisAnterior} loading={loading} />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <VentasChart data={ventasDiarias} loading={loading} />
              <PedidosPorEstadoChart data={pedidosPorEstado} loading={loading} />
            </div>
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <UltimosPedidos
                data={ultimosPedidos}
                loading={loading}
                getOrderHref={canViewOrders ? rutaPedido : undefined}
              />
              <TopProductos data={topProductos} loading={loading} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
