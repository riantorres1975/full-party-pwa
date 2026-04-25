import { useLanguage } from '../../../../hooks/useLanguage';

export default function ClientesFrecuentes({ clientes }) {
  const { t } = useLanguage();
  const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
      <div className="px-4 py-3 border-b border-admin-border">
        <h3 className="text-sm font-body font-black text-admin-text">{t('reportes.clientes.titulo')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="bg-admin-elevated">
              <th className="text-left px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.clientes.nombre')}</th>
              <th className="text-left px-4 py-2 font-bold text-admin-muted uppercase tracking-wide hidden sm:table-cell">{t('reportes.clientes.telefono')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.clientes.pedidos')}</th>
              <th className="text-right px-4 py-2 font-bold text-admin-muted uppercase tracking-wide">{t('reportes.clientes.gasto')}</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => (
              <tr key={i} className="border-t border-admin-border hover:bg-admin-elevated/40 transition-colors">
                <td className="px-4 py-2 font-bold text-admin-text truncate max-w-[140px]">{c.nombre}</td>
                <td className="px-4 py-2 text-admin-muted hidden sm:table-cell">{c.telefono}</td>
                <td className="px-4 py-2 text-right">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fiesta-magenta/15 text-fiesta-magenta font-black">
                    {c.pedidos}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-bold text-emerald-500">{fmt(c.ingresos)}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-admin-muted">{t('reportes.sinDatos')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
