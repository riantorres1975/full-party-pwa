import { Component, Fragment, useId } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { trackAppError } from '../../utils/analytics';

class ErrorBoundaryCore extends Component {
  state = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info);
    trackAppError(error, {
      context: 'react_boundary',
      route: this.props.resetKey,
    });
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState(({ retryKey }) => ({ error: null, retryKey: retryKey + 1 }));
    }
  }

  retry = () => {
    this.setState(({ retryKey }) => ({ error: null, retryKey: retryKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return this.props.renderFallback(this.state.error, this.retry);
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}

function isChunkLoadError(error) {
  return /chunkloaderror|loading chunk|dynamically imported module|failed to fetch/i.test(
    `${error?.name || ''} ${error?.message || ''}`
  );
}

export default function AppErrorBoundary({ children, compact = false, homePath }) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const titleId = useId();
  const destination = homePath || (location.pathname.startsWith('/admin') ? '/admin' : '/');

  const renderFallback = (error, retry) => {
    const requiresReload = isChunkLoadError(error);
    const handlePrimaryAction = requiresReload
      ? () => window.location.reload()
      : retry;

    return (
      <section
        role="alert"
        aria-labelledby={titleId}
        className={compact
          ? 'flex min-h-[55vh] items-center justify-center px-4 py-10'
          : 'flex min-h-screen items-center justify-center bg-admin-bg px-4 py-10'}
      >
        <div className="w-full max-w-md rounded-2xl border border-admin-border bg-admin-card p-6 text-center shadow-elevated sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <AlertTriangle size={24} aria-hidden="true" />
          </div>
          <h1 id={titleId} className="font-display text-xl text-admin-text">
            {t('error.boundary.title')}
          </h1>
          <p className="mt-2 text-sm font-body text-admin-muted">
            {t('error.boundary.description')}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-fiesta-magenta px-4 py-2.5 text-sm font-body font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta focus-visible:ring-offset-2"
            >
              <RefreshCw size={15} aria-hidden="true" />
              {requiresReload ? t('error.boundary.reload') : t('common.retry')}
            </button>
            <button
              type="button"
              onClick={() => navigate(destination, { replace: true })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-body font-bold text-admin-text transition-colors hover:bg-admin-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta"
            >
              <Home size={15} aria-hidden="true" />
              {location.pathname.startsWith('/admin')
                ? t('error.boundary.adminHome')
                : t('error.boundary.home')}
            </button>
          </div>

          {import.meta.env.DEV && error?.message && (
            <details className="mt-5 text-left text-xs font-body text-admin-muted">
              <summary className="cursor-pointer font-bold">{t('error.boundary.details')}</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-admin-bg p-3">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </section>
    );
  };

  return (
    <ErrorBoundaryCore resetKey={location.pathname} renderFallback={renderFallback}>
      {children}
    </ErrorBoundaryCore>
  );
}
