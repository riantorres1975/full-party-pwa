import { ShoppingBag, DollarSign, XCircle, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';

function Card({ icon: Icon, label, value, sub, color = 'text-admin-text' }) {
  return (
    <div className="bg-admin-card rounded-xl border border-admin-border p-4 flex items-start gap-3">
      <div className={`mt-0.5 ${color} opacity-80`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-body font-black mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs font-body text-admin-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ResumenCards({ resumen }) {
  const { t } = useLanguage();
  const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Card
        icon={ShoppingBag}
        label={t('reportes.resumen.pedidos')}
        value={resumen.totalPedidos}
        sub={`${resumen.pedidosCompletados} ${t('reportes.resumen.completados')}`}
        color="text-admin-text"
      />
      <Card
        icon={DollarSign}
        label={t('reportes.resumen.ingresos')}
        value={fmt(resumen.ingresos)}
        color="text-emerald-500"
      />
      <Card
        icon={TrendingUp}
        label={t('reportes.resumen.ticket')}
        value={fmt(resumen.ticketPromedio)}
        color="text-fiesta-magenta"
      />
      <Card
        icon={Users}
        label={t('reportes.resumen.clientes')}
        value={resumen.clientesUnicos}
        color="text-blue-400"
      />
      <Card
        icon={XCircle}
        label={t('reportes.resumen.cancelados')}
        value={resumen.cancelados}
        sub={`${resumen.tasaCancelacion.toFixed(1)}%`}
        color="text-red-400"
      />
    </div>
  );
}
