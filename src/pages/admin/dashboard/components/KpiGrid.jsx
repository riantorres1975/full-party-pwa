import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';

const indicadores = [
  { key: 'ingresos', label: 'revenue', Icon: DollarSign, currency: true },
  { key: 'pedidos', label: 'orders', Icon: ShoppingCart },
  { key: 'ticketPromedio', label: 'avg_ticket', Icon: TrendingUp, currency: true },
  { key: 'clientesUnicos', label: 'unique_clients', Icon: Users },
];

const formatCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const formatCount = new Intl.NumberFormat('es-MX');
const formatChange = new Intl.NumberFormat('es-MX', { style: 'percent', signDisplay: 'exceptZero' });

export default function KpiGrid({ kpis, kpisAnterior, loading }) {
  const { t } = useLanguage();

  return (
    <div aria-busy={loading} className="grid gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
      {indicadores.map(({ key, label, Icon, currency }) => {
        const previo = kpisAnterior[key];
        const actual = kpis[key];
        const cambio = previo > 0 ? formatChange.format((actual - previo) / previo) : null;
        return (
          <div key={key} className="min-w-0 rounded-2xl border border-admin-border bg-admin-card px-3.5 py-4 sm:p-4">
            <div className="flex items-center gap-2 text-admin-muted">
              <Icon size={16} className="shrink-0" aria-hidden="true" />
              <p className="text-xs font-bold leading-tight sm:text-sm">{t(`admin.dashboard.kpi.${label}`)}</p>
            </div>
            {loading ? (
              <div className="mt-2 h-12 max-w-32 animate-pulse rounded-lg bg-admin-elevated" />
            ) : (
              <>
                <p className="mt-2 break-words text-xl font-black tabular-nums text-admin-text sm:text-2xl">{(currency ? formatCurrency : formatCount).format(actual)}</p>
                <p className="mt-1 text-[11px] font-semibold leading-snug text-admin-muted">
                  {cambio ? t('admin.dashboard.kpi.periodChange', { value: cambio }) : t('admin.dashboard.kpi.noPrevious')}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
