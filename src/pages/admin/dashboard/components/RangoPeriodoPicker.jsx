import { useState } from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';

const PRESETS = {
  today: { getDates: () => [todayStart(), todayEnd()] },
  '7d': { getDates: () => [subDays(todayStart(), 6), todayEnd()] },
  '30d': { getDates: () => [subDays(todayStart(), 29), todayEnd()] },
  '90d': { getDates: () => [subDays(todayStart(), 89), todayEnd()] },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function subDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

function dateToInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function RangoPeriodoPicker({ periodo, onChangePeriodo }) {
  const { t } = useLanguage();
  const [mostrarCustom, setMostrarCustom] = useState(periodo === 'custom');
  const [desdeInput, setDesdeInput] = useState(dateToInput(new Date()));
  const [hastaInput, setHastaInput] = useState(dateToInput(new Date()));
  const presetLabels = {
    today: t('admin.dashboard.period.today'),
    '7d': t('admin.dashboard.period.7d'),
    '30d': t('admin.dashboard.period.30d'),
    '90d': t('admin.dashboard.period.90d'),
  };

  const handlePreset = (preset) => {
    const [desde, hasta] = PRESETS[preset].getDates();
    onChangePeriodo(preset, desde, hasta);
    setMostrarCustom(false);
  };

  const handleCustom = () => {
    const desdeBase = parseInputDate(desdeInput);
    const hastaBase = parseInputDate(hastaInput);
    if (!desdeBase || !hastaBase) return;

    const desde = startOfDay(desdeBase);
    const hasta = endOfDay(hastaBase);

    if (desde <= hasta) {
      onChangePeriodo('custom', desde, hasta);
      setMostrarCustom(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(PRESETS).map(([key]) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
              periodo === key
                ? 'bg-ink-500 text-white'
                : 'bg-admin-elevated text-admin-text hover:bg-admin-muted'
            }`}
          >
            {presetLabels[key]}
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
