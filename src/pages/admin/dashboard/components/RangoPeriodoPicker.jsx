import { useState } from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';

const PRESETS = {
  today: { label: 'Hoy', getDates: () => [today(), today()] },
  '7d': { label: '7 días', getDates: () => [subDays(today(), 7), today()] },
  '30d': { label: '30 días', getDates: () => [subDays(today(), 30), today()] },
  '90d': { label: '90 días', getDates: () => [subDays(today(), 90), today()] },
};

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function subDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

function dateToInput(date) {
  return date.toISOString().split('T')[0];
}

export default function RangoPeriodoPicker({ periodo, onChangePeriodo }) {
  const { t } = useLanguage();
  const [mostrarCustom, setMostrarCustom] = useState(periodo === 'custom');
  const [desdeInput, setDesdeInput] = useState(dateToInput(new Date()));
  const [hastaInput, setHastaInput] = useState(dateToInput(new Date()));

  const handlePreset = (preset) => {
    const [desde, hasta] = PRESETS[preset].getDates();
    onChangePeriodo(preset, desde, hasta);
    setMostrarCustom(false);
  };

  const handleCustom = () => {
    const desde = new Date(desdeInput);
    const hasta = new Date(hastaInput);
    desde.setHours(0, 0, 0, 0);
    hasta.setHours(23, 59, 59, 999);

    if (desde <= hasta) {
      onChangePeriodo('custom', desde, hasta);
      setMostrarCustom(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
              periodo === key
                ? 'bg-ink-500 text-white'
                : 'bg-admin-elevated text-admin-text hover:bg-admin-muted'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setMostrarCustom(!mostrarCustom)}
          className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
            periodo === 'custom'
              ? 'bg-ink-500 text-white'
              : 'bg-admin-elevated text-admin-text hover:bg-admin-muted'
          }`}
        >
          {t('admin.dashboard.period.custom')}
        </button>
      </div>

      {mostrarCustom && (
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-admin-text-secondary">
              {t('common.desde')}
            </label>
            <input
              type="date"
              value={desdeInput}
              onChange={(e) => setDesdeInput(e.target.value)}
              className="px-3 py-1 rounded border border-admin-border bg-admin-input text-admin-text text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-admin-text-secondary">
              {t('common.hasta')}
            </label>
            <input
              type="date"
              value={hastaInput}
              onChange={(e) => setHastaInput(e.target.value)}
              className="px-3 py-1 rounded border border-admin-border bg-admin-input text-admin-text text-sm"
            />
          </div>
          <button
            onClick={handleCustom}
            className="px-3 py-1 rounded bg-ink-500 text-white font-bold hover:bg-ink-600 transition-colors text-sm"
          >
            {t('common.aplicar')}
          </button>
        </div>
      )}
    </div>
  );
}
