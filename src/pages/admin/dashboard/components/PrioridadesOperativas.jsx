import { ArrowRight, CircleDollarSign, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ESTADOS_ACTIVOS, ESTADO_META, FILTRO_ESTADO_ACTIVO, estadoLabel } from '../../../../lib/estadoMeta';

const formatCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const stageTones = {
  'Por Surtir': 'bg-violet-100 text-violet-700',
  'Armando Pedido': 'bg-amber-100 text-amber-800',
  'Listo para Entrega': 'bg-emerald-100 text-emerald-800',
};

const focusStyle = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fiesta-magenta';

export default function PrioridadesOperativas({
  contadores, prioridades, pedidosLoading, pedidosError, stockLoading, stockAvailable,
  showOrders, showPayments, showInventory,
}) {
  const { t } = useLanguage();
  const valorPedido = (value) => pedidosLoading ? '…' : pedidosError ? '—' : (value ?? 0);
  const resumen = [
    showPayments && {
      label: t('admin.dashboard.priorities.payments'),
      to: '/admin/pagos?filtro=pendiente&periodo=todo',
      Icon: CircleDollarSign,
      count: valorPedido(prioridades.pagosPendientes),
      detail: pedidosError ? t('admin.dashboard.priorityUnavailable') : !pedidosLoading && formatCurrency.format(prioridades.pagosPendientesTotal),
    },
    showInventory && {
      label: t('admin.dashboard.priorities.stock'),
      to: '/admin/inventario',
      Icon: Package,
      count: stockAvailable ? prioridades.stockBajo + prioridades.sinStock : stockLoading ? '…' : '—',
      detail: stockAvailable
        ? t('admin.dashboard.priorities.stockDetail', { low: prioridades.stockBajo, empty: prioridades.sinStock })
        : !stockLoading && t('admin.dashboard.priorityUnavailable'),
    },
  ].filter(Boolean);

  if (!showOrders && resumen.length === 0) return null;

  return (
    <section aria-labelledby="dashboard-priorities-title" className="rounded-3xl border border-admin-border bg-admin-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id="dashboard-priorities-title" className="text-lg font-black text-admin-text sm:text-xl">
          {t('admin.dashboard.priorities.title')}
        </h2>
        {showOrders && (
          <Link to="/admin/pedidos" className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-bold text-fiesta-magenta hover:underline ${focusStyle}`}>
            {t('admin.dashboard.viewOrders')} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>

      {showOrders && (
        <div aria-busy={pedidosLoading} className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {ESTADOS_ACTIVOS.map(estado => {
            const Icon = ESTADO_META[estado].icon;
            return (
              <Link
                key={estado}
                to={`/admin/pedidos?estado=${FILTRO_ESTADO_ACTIVO[estado]}`}
                className={`group flex min-w-0 items-center gap-3 rounded-2xl border border-admin-border bg-admin-bg px-3.5 py-3 transition-colors hover:border-fiesta-magenta/40 hover:bg-admin-elevated sm:flex-col sm:items-start sm:gap-3.5 sm:p-4 ${focusStyle}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stageTones[estado]}`}><Icon size={20} aria-hidden="true" /></span>
                <span className="flex flex-1 items-center justify-between gap-3 sm:w-full sm:flex-row-reverse sm:justify-end">
                  <span className="text-sm font-bold leading-snug text-admin-text-secondary">{estadoLabel(estado, t)}</span>
                  <strong className="text-2xl font-black leading-none tabular-nums text-admin-text">{valorPedido(contadores[estado])}</strong>
                </span>
                <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-admin-muted transition-transform group-hover:translate-x-0.5 sm:hidden" />
              </Link>
            );
          })}
        </div>
      )}
      {showOrders && pedidosError && <p role="status" className="mt-2 text-sm text-admin-muted">{t('admin.dashboard.ordersUnavailable')}</p>}

      {resumen.length > 0 && (
        <div className={`grid gap-2.5 sm:grid-cols-2 sm:gap-3 ${showOrders ? 'mt-4 border-t border-admin-border pt-4' : ''}`}>
          {resumen.map(({ label, to, Icon, count, detail }) => (
            <Link key={to} to={to} className={`group flex min-w-0 items-center gap-3 rounded-xl border border-admin-border px-3.5 py-3 hover:bg-admin-elevated ${focusStyle}`}>
              <Icon size={19} aria-hidden="true" className="shrink-0 text-admin-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-admin-text">{label}</span>
                {detail && <span className="block text-xs text-admin-muted">{detail}</span>}
              </span>
              <strong className="text-base font-black tabular-nums text-admin-text">{count}</strong>
              <ArrowRight size={15} aria-hidden="true" className="shrink-0 text-admin-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
