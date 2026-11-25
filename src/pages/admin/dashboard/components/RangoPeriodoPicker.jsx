import { useId, useState } from 'react';
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
  const customId = useId();
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
    <div className="flex min-w-0 flex-wrap items-start gap-3">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(PRESETS).map(([key]) => (
          <button
            key={key}
            type="button"
            aria-pressed={periodo === key}
            onClick={() => handlePreset(key)}
            className={`min-h-10 rounded-lg px-3 text-sm font-bold transition-colors ${
              periodo === key
                ? 'bg-ink-500 text-white'
                : 'bg-admin-elevated text-admin-text hover:bg-admin-muted'
            }`}
          >
            {presetLabels[key]}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={mostrarCustom}
          aria-controls={mostrarCustom ? customId : undefined}
          onClick={() => setMostrarCustom(!mostrarCustom)}
          className={`min-h-10 rounded-lg px-3 text-sm font-bold transition-colors ${
            periodo === 'custom'
              ? 'bg-ink-500 text-white'
              : 'bg-admin-elevated text-admin-text hover:bg-admin-muted'
          }`}
        >
          {t('admin.dashboard.period.custom')}
        </button>
      </div>

      {mostrarCustom && (
        <div id={customId} className="flex max-w-full flex-wrap items-end gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={`${customId}-desde`} className="text-xs font-bold text-admin-text-secondary">
              {t('common.desde')}
            </label>
            <input
              type="date"
              id={`${customId}-desde`}
              value={desdeInput}
              max={hastaInput || undefined}
              onChange={(e) => setDesdeInput(e.target.value)}
              className="min-h-10 rounded-lg border border-admin-border bg-admin-input px-2 text-sm text-admin-text"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={`${customId}-hasta`} className="text-xs font-bold text-admin-text-secondary">
              {t('common.hasta')}
            </label>
            <input
              type="date"
              id={`${customId}-hasta`}
              value={hastaInput}
              min={desdeInput || undefined}
              onChange={(e) => setHastaInput(e.target.value)}
              className="min-h-10 rounded-lg border border-admin-border bg-admin-input px-2 text-sm text-admin-text"
            />
          </div>
          <button
            type="button"
            onClick={handleCustom}
            disabled={!desdeInput || !hastaInput || desdeInput > hastaInput}
            className="min-h-10 rounded-lg bg-ink-500 px-3 text-sm font-bold text-white transition-colors hover:bg-ink-600 disabled:opacity-50"
          >
            {t('common.aplicar')}
          </button>
        </div>
      )}
    </div>
  );
}
