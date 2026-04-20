import { useLanguage } from '../../../../hooks/useLanguage';

export default function TipoEntrega({ tipos }) {
  const { t } = useLanguage();
  const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const totalPedidos = tipos.reduce((s, x) => s + x.pedidos, 0);

  const COLORS = ['bg-fiesta-magenta', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-purple-400'];

  return (
    <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
      <div className="px-4 py-3 border-b border-admin-border">
        <h3 className="text-sm font-body font-black text-admin-text">{t('reportes.entrega.titulo')}</h3>
      </div>
      <div className="p-4 space-y-3">
        {tipos.map((tipo, i) => {
          const pct = totalPedidos > 0 ? (tipo.pedidos / totalPedidos) * 100 : 0;
          return (
            <div key={tipo.tipo}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-body font-bold text-admin-text truncate">{tipo.tipo}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-body text-admin-muted">{tipo.pedidos} pedidos</span>
                  <span className="text-xs font-body font-bold text-emerald-500">{fmt(tipo.ingresos)}</span>
                  <span className="text-xs font-body text-admin-muted w-8 text-right">{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-admin-elevated overflow-hidden">
                <div
                  className={`h-full rounded-full ${COLORS[i % COLORS.length]} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {tipos.length === 0 && (
          <p className="text-center text-xs text-admin-muted py-4">{t('reportes.sinDatos')}</p>
        )}
      </div>
    </div>
  );
}
