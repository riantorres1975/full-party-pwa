import { Package } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';

export default function ProductosRanking({ productos }) {
  const { t } = useLanguage();
  const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
      <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between">
        <h3 className="text-sm font-body font-black text-admin-text">{t('reportes.productos.titulo')}</h3>
        <span className="text-xs font-body text-admin-muted">{productos.length} {t('reportes.productos.total')}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="bg-admin-elevated">
              <th className="text-left px-4 py-2 font-bold text-admin-muted uppercase tracking-wide w-8">#</th>
              <th className="text-left px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.productos.nombre')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.productos.cantidad')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.productos.ingresos')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide hidden sm:table-cell">{t('reportes.productos.pct')}</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.id || p.nombre} className="border-t border-admin-border hover:bg-admin-elevated/40 transition-colors">
                <td className="px-4 py-2 text-admin-muted font-bold">{i + 1}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-7 h-7 rounded-md object-cover shrink-0 bg-admin-elevated" />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-admin-elevated flex items-center justify-center shrink-0">
                        <Package size={11} className="text-admin-muted" />
                      </div>
                    )}
                    <span className="font-bold text-admin-text truncate">{p.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-admin-text">{p.cantidad}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-500">{fmt(p.ingresos)}</td>
                <td className="px-4 py-2 text-right text-admin-muted hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-admin-elevated overflow-hidden">
                      <div className="h-full rounded-full bg-fiesta-magenta" style={{ width: `${Math.min(p.pct, 100)}%` }} />
                    </div>
                    <span className="w-8 text-right">{p.pct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-admin-muted">{t('reportes.sinDatos')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
