import { useLanguage } from '../../../../hooks/useLanguage';

const FILTROS = ['todos', 'sinStock', 'bajo', 'ilimitado'];

export default function InventarioFilters({ active, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      {FILTROS.map((f) => (
        <button
          type="button"
          key={f}
          onClick={() => onChange(f)}
          aria-pressed={active === f}
          className={`px-3 py-1.5 rounded-lg text-xs font-body font-bold transition-colors ${
            active === f
              ? 'bg-fiesta-magenta text-white'
              : 'bg-admin-elevated text-admin-muted hover:text-admin-text'
          }`}
        >
          {t(`inventario.filtro.${f}`)}
        </button>
      ))}
    </div>
  );
}
