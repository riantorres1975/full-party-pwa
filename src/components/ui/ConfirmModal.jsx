import { useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export default function ConfirmModal({
  open,
  title,
  message = '',
  confirmLabel,
  cancelLabel,
  variant = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const { t } = useLanguage();

  const resolvedTitle = title || t('confirm.defaultTitle');
  const resolvedConfirm = confirmLabel || t('common.confirm');
  const resolvedCancel = cancelLabel || t('confirm.cancel');

  useDialogFocus({ open, containerRef: dialogRef, initialFocusRef: cancelRef, onClose: onCancel });

  if (!open) return null;

  const variants = {
    danger: { icon: 'bg-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500' },
    warning: { icon: 'bg-amber-100 text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500' },
    info: { icon: 'bg-blue-100 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500' },
  };
  const v = variants[variant] || variants.danger;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative bg-admin-card border border-admin-border rounded-2xl shadow-elevated p-6 w-full max-w-sm animate-[scaleIn_200ms_ease-out]"
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${v.icon}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="text-base font-bold text-admin-text">{resolvedTitle}</h3>
            {message && <p className="mt-1 text-sm text-admin-muted">{message}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-admin-border text-admin-text hover:bg-admin-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta"
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${v.btn}`}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
