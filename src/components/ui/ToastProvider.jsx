import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700', icon: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  error:   { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700', icon: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
  info:    { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700', icon: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700', icon: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

function Toast({ toast, onDismiss }) {
  const { type = 'info', message } = toast;
  const c = COLORS[type] || COLORS.info;
  const Icon = ICONS[type] || Info;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm border rounded-xl p-4 shadow-elevated
                  ${c.bg} ${c.border}
                  animate-[slideUpToast_300ms_ease-out] data-[removing=true]:animate-[toastOut_200ms_ease-in_forwards]`}
      data-removing={toast._removing || undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.icon}`} />
      <p className="flex-1 text-sm font-medium text-admin-text">{message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4 text-admin-muted" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden bg-black/5">
        <div
          className={`h-full ${c.bar} rounded-full`}
          style={{ animation: `linear ${AUTO_DISMISS_MS}ms forwards`, animationName: 'shrinkWidth' }}
        />
      </div>
    </div>
  );
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, _removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const toast = useCallback(({ type = 'info', message }) => {
    const id = ++toastId;
    setToasts(prev => {
      const next = [...prev, { id, type, message }];
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
    });
    timersRef.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return id;
  }, [dismiss]);

  const success = useCallback((message) => toast({ type: 'success', message }), [toast]);
  const error = useCallback((message) => toast({ type: 'error', message }), [toast]);
  const info = useCallback((message) => toast({ type: 'info', message }), [toast]);
  const warning = useCallback((message) => toast({ type: 'warning', message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, dismiss }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed z-[9999] bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-4 lg:bottom-4 flex flex-col gap-2 items-center lg:items-end pointer-events-none w-full max-w-sm px-4 lg:px-0"
      >
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
