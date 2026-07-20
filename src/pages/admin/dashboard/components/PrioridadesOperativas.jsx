import { AlertTriangle, ArrowRight, CircleDollarSign, ClipboardList, PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../hooks/useLanguage';

const formatCurrency = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
}).format(value || 0);

export default function PrioridadesOperativas({ prioridades, loading }) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-3" aria-label={t('admin.dashboard.priorities.title')}>
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border border-admin-border bg-admin-card" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: 'orders',
      to: '/admin/pedidos?tab=activos',
      icon: ClipboardList,
      count: prioridades.pedidosPorSurtir,
      label: t('admin.dashboard.priorities.orders'),
      detail: t('admin.dashboard.priorities.ordersDetail'),
      tone: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      key: 'payments',
      to: '/admin/pagos?filtro=pendiente&periodo=todo',
      icon: CircleDollarSign,
      count: prioridades.pagosPendientes,
      label: t('admin.dashboard.priorities.payments'),
      detail: formatCurrency(prioridades.pagosPendientesTotal),
      tone: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      key: 'stock',
      to: '/admin/inventario',
      icon: PackageX,
      count: prioridades.stockBajo + prioridades.sinStock,
      label: t('admin.dashboard.priorities.stock'),
      detail: t('admin.dashboard.priorities.stockDetail', {
        low: prioridades.stockBajo,
        empty: prioridades.sinStock,
      }),
      tone: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
  ];

  const allClear = cards.every((card) => card.count === 0);

  return (
    <section aria-labelledby="dashboard-priorities-title">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={16} className={allClear ? 'text-emerald-500' : 'text-amber-500'} aria-hidden="true" />
        <h2 id="dashboard-priorities-title" className="font-display text-base text-admin-text">
          {t('admin.dashboard.priorities.title')}
        </h2>
        {allClear && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-500">
            {t('admin.dashboard.priorities.clear')}
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {cards.map(({ key, to, icon: Icon, count, label, detail, tone }) => (
          <Link
            key={key}
            to={to}
            className="group flex min-h-24 items-center gap-3 rounded-xl border border-admin-border bg-admin-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-admin-text/15 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tone}`}>
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-2xl font-black leading-none text-admin-text">{count}</span>
              <span className="mt-1 block text-xs font-bold text-admin-text">{label}</span>
              <span className="mt-0.5 block truncate text-[11px] text-admin-muted">{detail}</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-admin-muted transition-transform group-hover:translate-x-0.5 group-hover:text-admin-text" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
