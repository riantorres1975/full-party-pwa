import { useState, useEffect } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import PageHeader from '../../../components/admin/PageHeader';
import RangoPeriodoPicker from './components/RangoPeriodoPicker';
import KpiGrid from './components/KpiGrid';
import VentasChart from './components/VentasChart';
import PedidosPorEstadoChart from './components/PedidosPorEstadoChart';
import TopProductos from './components/TopProductos';
import UltimosPedidos from './components/UltimosPedidos';
import { useDashboardData } from './hooks/useDashboardData';

function getDefaultDates() {
  const hasta = new Date();
  hasta.setHours(23, 59, 59, 999);
  const desde = new Date(hasta);
  desde.setDate(desde.getDate() - 30);
  desde.setHours(0, 0, 0, 0);
  return { desde, hasta };
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [periodo, setPeriodo] = useState('30d');
  const [fechas, setFechas] = useState(getDefaultDates());

  const { kpis, kpisAnterior, ventasDiarias, pedidosPorEstado, topProductos, ultimosPedidos, loading, error } = useDashboardData({
    desde: fechas.desde,
    hasta: fechas.hasta,
  });

  const handleChangePeriodo = (newPeriodo, desde, hasta) => {
    setPeriodo(newPeriodo);
    setFechas({ desde, hasta });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-admin-text font-bold">{t('admin.dashboard.error')}</p>
          <p className="text-admin-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg">
      <div className="px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title={t('admin.dashboard.title')}
            subtitle={t('admin.dashboard.subtitle')}
          />
        </div>

        {/* Periodo picker */}
        <div className="mb-8">
          <RangoPeriodoPicker periodo={periodo} onChangePeriodo={handleChangePeriodo} />
        </div>

        {/* KPI Grid */}
        <div className="mb-8">
          <KpiGrid kpis={kpis} kpisAnterior={kpisAnterior} loading={loading} />
        </div>

        {/* Charts Grid */}
        <div className="mb-8">
          <div className="lg:grid-cols-3 gap-4 hidden lg:grid">
            <div className="lg:col-span-2">
              <VentasChart data={ventasDiarias} loading={loading} />
            </div>
            <div className="lg:col-span-1">
              <PedidosPorEstadoChart data={pedidosPorEstado} loading={loading} />
            </div>
          </div>

          {/* Mobile: stack everything */}
          <div className="lg:hidden space-y-4">
            <VentasChart data={ventasDiarias} loading={loading} />
            <PedidosPorEstadoChart data={pedidosPorEstado} loading={loading} />
          </div>
        </div>

        {/* Products + Recent orders */}
        <div className="mb-8">
          <div className="lg:grid lg:grid-cols-3 gap-4 hidden">
            <div className="lg:col-span-1">
              <TopProductos data={topProductos} loading={loading} />
            </div>
            <div className="lg:col-span-2">
              <UltimosPedidos data={ultimosPedidos} loading={loading} />
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-4">
            <div className="bg-admin-card border border-admin-border rounded-lg p-4">
              <h3 className="text-sm font-body font-bold text-admin-text mb-4">
                {t('admin.dashboard.chart.top_products')}
              </h3>
              <TopProductos data={topProductos} loading={loading} />
            </div>
            <UltimosPedidos data={ultimosPedidos} loading={loading} />
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-24 lg:h-0" />
      </div>
    </div>
  );
}
