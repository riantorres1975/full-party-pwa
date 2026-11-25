import { useLanguage } from '../../../../hooks/useLanguage';

export const FILTROS = ['todos', 'alertas', 'sinStock', 'bajo', 'ok'];

export default function InventarioFilters({ active, onChange, counts }) {
  const { t } = useLanguage();

  return (
    <div role="group" aria-label={t('inventario.filtrarPorEstado')} className="flex flex-wrap gap-2">
      {FILTROS.map((f) => (
        <button
          type="button"
          key={f}
          onClick={() => onChange(f)}
          aria-pressed={active === f}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-fiesta-magenta ${
            active === f
              ? 'border-violet-700 bg-violet-700 text-white'
              : 'border-admin-border bg-admin-card text-admin-text-secondary hover:bg-admin-elevated'
          }`}
        >
          {t(`inventario.filtro.${f}`)}
          {counts && <span className="rounded-md bg-black/5 px-1.5 py-0.5 tabular-nums">{counts[f]}</span>}
        </button>
      ))}
    </div>
  );
}
