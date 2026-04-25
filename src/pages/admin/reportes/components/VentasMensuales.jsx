import { useLanguage } from '../../../../hooks/useLanguage';

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function VentasMensuales({ meses }) {
  const { t, language } = useLanguage();
  const MESES = language === 'en' ? MESES_EN : MESES_ES;

  const maxIngresos = Math.max(...meses.map((m) => m.ingresos), 1);
  const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
      <div className="px-4 py-3 border-b border-admin-border">
        <h3 className="text-sm font-body font-black text-admin-text">{t('reportes.ventas.titulo')}</h3>
      </div>

      {/* Gráfica de barras simple */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-end gap-1 h-28">
          {meses.map((m) => {
            const pct = (m.ingresos / maxIngresos) * 100;
            return (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-admin-elevated border border-admin-border rounded-lg px-2 py-1 text-[10px] font-body whitespace-nowrap shadow-elevated pointer-events-none left-1/2 -translate-x-1/2">
                  <p className="font-bold text-admin-text">{MESES[m.mes]}</p>
                  <p className="text-emerald-400">{fmt(m.ingresos)}</p>
                  <p className="text-admin-muted">{m.pedidos} {t('reportes.ventas.pedidos')}</p>
                </div>
                <div
                  className="w-full rounded-t-sm bg-fiesta-magenta/70 hover:bg-fiesta-magenta transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {meses.map((m) => (
            <div key={m.mes} className="flex-1 text-center text-[9px] font-body text-admin-muted">
              {MESES[m.mes]}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="border-t border-admin-border bg-admin-elevated">
              <th className="text-left px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.ventas.mes')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.ventas.pedidosCol')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.ventas.ingresos')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide hidden sm:table-cell">{t('reportes.ventas.ticket')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide hidden sm:table-cell">{t('reportes.ventas.cancelados')}</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.mes} className="border-t border-admin-border hover:bg-admin-elevated/40 transition-colors">
                <td className="px-4 py-2 font-bold text-admin-text">{MESES[m.mes]}</td>
                <td className="px-4 py-2 text-right text-admin-text">{m.pedidos}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-500">{fmt(m.ingresos)}</td>
                <td className="px-4 py-2 text-right text-admin-muted hidden sm:table-cell">{m.ticketPromedio > 0 ? fmt(m.ticketPromedio) : '—'}</td>
                <td className="px-4 py-2 text-right hidden sm:table-cell">
                  {m.cancelados > 0 ? <span className="text-red-400">{m.cancelados}</span> : <span className="text-admin-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
