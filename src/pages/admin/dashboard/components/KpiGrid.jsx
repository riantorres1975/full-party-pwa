import StatsCard from '../../../../components/admin/StatsCard';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';

export default function KpiGrid({ kpis, kpisAnterior, loading }) {
  const { t } = useLanguage();

  const calculateDelta = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = Math.round(((current - previous) / previous) * 100);
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct}%`;
  };

  const deltaIngresos = calculateDelta(kpis.ingresos, kpisAnterior.ingresos);
  const deltaPedidos = calculateDelta(kpis.pedidos, kpisAnterior.pedidos);
  const deltaTicket = calculateDelta(kpis.ticketPromedio, kpisAnterior.ticketPromedio);
  const deltaClientes = calculateDelta(kpis.clientesUnicos, kpisAnterior.clientesUnicos);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-admin-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        icon={DollarSign}
        label={t('admin.dashboard.kpi.revenue')}
        value={formatCurrency(kpis.ingresos)}
        trend={deltaIngresos}
        variant="success"
      />
      <StatsCard
        icon={ShoppingCart}
        label={t('admin.dashboard.kpi.orders')}
        value={kpis.pedidos}
        trend={deltaPedidos}
        variant="info"
      />
      <StatsCard
        icon={TrendingUp}
        label={t('admin.dashboard.kpi.avg_ticket')}
        value={formatCurrency(kpis.ticketPromedio)}
        trend={deltaTicket}
        variant="warning"
      />
      <StatsCard
        icon={Users}
        label={t('admin.dashboard.kpi.unique_clients')}
        value={kpis.clientesUnicos}
        trend={deltaClientes}
        variant="default"
      />
    </div>
  );
}
