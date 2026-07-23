import { AlertTriangle, CheckCircle2, Copy, ImageOff, ShieldAlert, Sparkles } from 'lucide-react';
import { CATALOG_QUALITY_ISSUES } from '../../../utils/catalogQuality';

const ISSUE_FILTERS = [
  { issue: CATALOG_QUALITY_ISSUES.MISSING_IMAGE, icon: ImageOff },
  { issue: CATALOG_QUALITY_ISSUES.MISSING_DESCRIPTION, icon: AlertTriangle },
  { issue: CATALOG_QUALITY_ISSUES.MISSING_CATEGORY, icon: AlertTriangle },
  { issue: CATALOG_QUALITY_ISSUES.MISSING_BRAND, icon: AlertTriangle },
  { issue: CATALOG_QUALITY_ISSUES.INVALID_PRICE, icon: AlertTriangle },
  { issue: CATALOG_QUALITY_ISSUES.INVALID_STOCK, icon: AlertTriangle },
];

function StatButton({
  active,
  icon: Icon,
  label,
  value,
  detail,
  tone,
  onClick,
}) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-rose-200 bg-rose-50 text-rose-800',
    blue: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-0 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
        tones[tone]
      } ${active ? 'ring-2 ring-fiesta-magenta ring-offset-1' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-body font-black uppercase tracking-wide">{label}</span>
        <Icon size={17} aria-hidden="true" />
      </div>
      <p className="mt-1 text-xl font-body font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-body font-bold opacity-75">{detail}</p>
    </button>
  );
}

export default function CatalogQualityPanel({
  analysis,
  activeFilter,
  onSelectFilter,
  t,
}) {
  const { summary, issueCounts } = analysis;
  const selectFilter = (filter) => {
    onSelectFilter(activeFilter === filter ? 'todos' : filter);
  };

  return (
    <section
      className="rounded-2xl border border-admin-border bg-admin-card p-3 sm:p-4"
      aria-labelledby="catalog-quality-title"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-amber-500" aria-hidden="true" />
            <h2 id="catalog-quality-title" className="text-sm font-body font-black text-admin-text">
              {t('admin.catalog.qualityTitle')}
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] font-body text-admin-muted">
            {t('admin.catalog.qualitySubtitle', { count: summary.total })}
          </p>
        </div>
        <p className="text-xs font-body font-black text-admin-text-secondary">
          {t('admin.catalog.qualityAverage', { score: summary.averageScore })}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatButton
          active={activeFilter === 'quality:complete'}
          icon={CheckCircle2}
          label={t('admin.catalog.qualityComplete')}
          value={summary.completeCount}
          detail={t('admin.catalog.qualityCompleteDetail')}
          tone="green"
          onClick={() => selectFilter('quality:complete')}
        />
        <StatButton
          active={activeFilter === 'quality:incomplete'}
          icon={AlertTriangle}
          label={t('admin.catalog.qualityIncomplete')}
          value={summary.incompleteCount}
          detail={t('admin.catalog.qualityIncompleteDetail')}
          tone="amber"
          onClick={() => selectFilter('quality:incomplete')}
        />
        <StatButton
          active={activeFilter === 'quality:blocked'}
          icon={ShieldAlert}
          label={t('admin.catalog.qualityBlocked')}
          value={summary.blockedCount}
          detail={t('admin.catalog.qualityBlockedDetail')}
          tone="red"
          onClick={() => selectFilter('quality:blocked')}
        />
        <StatButton
          active={activeFilter === 'quality:duplicates'}
          icon={Copy}
          label={t('admin.catalog.qualityDuplicates')}
          value={summary.duplicateCount}
          detail={t('admin.catalog.qualityDuplicatesDetail')}
          tone="blue"
          onClick={() => selectFilter('quality:duplicates')}
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar" aria-label={t('admin.catalog.qualityIssues')}>
        {ISSUE_FILTERS.map(({ issue, icon: Icon }) => {
          const count = issueCounts[issue] || 0;
          if (count === 0) return null;
          const filter = `issue:${issue}`;
          return (
            <button
              key={issue}
              type="button"
              onClick={() => selectFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-body font-black transition-colors ${
                activeFilter === filter
                  ? 'border-fiesta-magenta bg-fiesta-magenta text-white'
                  : 'border-admin-border bg-admin-elevated text-admin-text-secondary hover:border-fiesta-magenta hover:text-fiesta-magenta'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {t(`admin.catalog.qualityIssue.${issue}`)}
              <span className={activeFilter === filter ? 'text-white/80' : 'text-admin-muted'}>{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
