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
  success: {
    border: 'border-emerald-200',
    icon: 'bg-emerald-50 text-emerald-600',
    action: 'text-emerald-700 hover:bg-emerald-50',
    bar: 'bg-emerald-500',
  },
  error: {
    border: 'border-red-200',
    icon: 'bg-red-50 text-red-600',
    action: 'text-red-700 hover:bg-red-50',
    bar: 'bg-red-500',
  },
  info: {
    border: 'border-blue-200',
    icon: 'bg-blue-50 text-blue-600',
    action: 'text-blue-700 hover:bg-blue-50',
    bar: 'bg-blue-500',
  },
  warning: {
    border: 'border-amber-200',
    icon: 'bg-amber-50 text-amber-600',
    action: 'text-amber-700 hover:bg-amber-50',
    bar: 'bg-amber-500',
  },
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;
const ACTION_TOAST_DISMISS_MS = 6000;

function Toast({ toast, onDismiss }) {
  const {
    type = 'info',
    title,
    message,
    actionLabel,
    onAction,
    duration = AUTO_DISMISS_MS,
  } = toast;
  const c = COLORS[type] || COLORS.info;
  const Icon = ICONS[type] || Info;

  const handleAction = () => {
    onAction?.();
    onDismiss(toast.id);
  };

  return (
    <div
      role="alert"
      className={`relative pointer-events-auto flex items-start gap-3 w-full max-w-sm overflow-hidden border rounded-2xl bg-white/95 p-3.5 pr-10
                  shadow-[0_18px_55px_rgba(20,16,45,0.18)] backdrop-blur-xl ${c.border}
                  animate-[slideUpToast_300ms_ease-out] data-[removing=true]:animate-[toastOut_200ms_ease-in_forwards]`}
      data-removing={toast._removing || undefined}
    >
      <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${c.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-sm font-black leading-tight text-slate-900">{title}</p>
        )}
        <p className={`${title ? 'mt-0.5 text-xs text-slate-600' : 'text-sm font-semibold text-slate-800'} line-clamp-2 leading-snug`}>
          {message}
        </p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={handleAction}
            className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs font-black transition-colors ${c.action}`}
          >
            {actionLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-slate-100">
        <div
          className={`h-full ${c.bar} rounded-full`}
          style={{ animation: `linear ${duration}ms forwards`, animationName: 'shrinkWidth' }}
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

  const toast = useCallback(({ type = 'info', message, ...options }) => {
    const id = ++toastId;
    const duration = options.duration
      ?? (options.actionLabel ? ACTION_TOAST_DISMISS_MS : AUTO_DISMISS_MS);
    setToasts(prev => {
      const next = [...prev, { id, type, message, ...options, duration }];
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
    });
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((message, options = {}) => toast({ type: 'success', message, ...options }), [toast]);
  const error = useCallback((message, options = {}) => toast({ type: 'error', message, ...options }), [toast]);
  const info = useCallback((message, options = {}) => toast({ type: 'info', message, ...options }), [toast]);
  const warning = useCallback((message, options = {}) => toast({ type: 'warning', message, ...options }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, dismiss }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed z-[9999] bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-3 pointer-events-none lg:bottom-4 lg:left-auto lg:right-4 lg:translate-x-0 lg:items-end lg:px-0"
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
