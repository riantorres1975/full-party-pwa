import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export default function DataErrorState({ message, onRetry, compact = false }) {
  const { t } = useLanguage();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-5 text-center ${compact ? 'py-8' : 'py-12'}`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <h2 className="text-base font-body font-black text-admin-text">
        {t('error.data.title')}
      </h2>
      {message && (
        <p className="mt-1 max-w-lg text-sm font-body text-admin-muted">{message}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 rounded-lg border border-admin-border bg-admin-card px-4 py-2 text-sm font-body font-bold text-admin-text transition-colors hover:bg-admin-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
