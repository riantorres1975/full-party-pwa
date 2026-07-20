import { useId, useRef, useState } from 'react';
import { X, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { ROLES, ROLE_LABELS, ROLE_LABELS_EN } from '../../../../lib/roles';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useInvitarUsuario } from '../hooks/useInvitarUsuario';
import { useDialogFocus } from '../../../../hooks/useDialogFocus';

const ROLE_ORDER = [ROLES.EMPLEADO, ROLES.MANAGER, ROLES.VIEWER, ROLES.ADMIN];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InvitarUsuarioModal({ onClose, onInvited }) {
  const { t, lang } = useLanguage();
  const { invitar, reenviar } = useInvitarUsuario();
  const labels = lang === 'en' ? ROLE_LABELS_EN : ROLE_LABELS;
  const dialogRef = useRef(null);
  const emailRef = useRef(null);
  const titleId = useId();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.EMPLEADO);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [result, setResult] = useState(null); // { inviteUrl, role } cuando ok
  const [alreadyPending, setAlreadyPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useDialogFocus({
    open: true,
    containerRef: dialogRef,
    initialFocusRef: emailRef,
    onClose,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError(t('usuarios.invite.emailInvalid'));
      return;
    }
    setEmailError('');
    setLoading(true);
    const res = await invitar(email.trim().toLowerCase(), role);
    setLoading(false);

    if (res.ok) {
      setResult({ inviteUrl: res.inviteUrl, role: res.role });
      onInvited?.();
    } else if (res.reason === 'emailExists') {
      setEmailError(t('admin.users.invite.emailExists'));
    } else if (res.reason === 'alreadyPending') {
      setAlreadyPending(true);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const res = await reenviar(email.trim().toLowerCase(), role);
    setLoading(false);
    if (res.ok) {
      setAlreadyPending(false);
      setResult({ inviteUrl: res.inviteUrl, role: res.role });
      onInvited?.();
    }
  };

  const handleCopy = async () => {
    if (!result?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const linkMessage = t('admin.users.invite.linkMessage').replace('{role}', labels[result?.role] ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative bg-admin-card border border-admin-border rounded-2xl shadow-elevated w-full max-w-md"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
          <h2 id={titleId} className="font-display font-black text-lg text-admin-text">
            {result ? t('admin.users.invite.linkReady') : t('usuarios.invite.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-admin-muted hover:bg-admin-elevated transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        {!result && !alreadyPending && (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="invite-email" className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide">
                {t('usuarios.invite.email')}
              </label>
              <input
                ref={emailRef}
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="ejemplo@correo.com"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'invite-email-error' : undefined}
                className="w-full px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40"
              />
              {emailError && (
                <p id="invite-email-error" role="alert" className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {emailError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="invite-role" className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide">
                {t('usuarios.invite.role')}
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40"
              >
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>{labels[r]}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 rounded-xl bg-fiesta-magenta text-white text-sm font-body font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : t('usuarios.invite.send')}
            </button>
          </form>
        )}

        {/* Ya existe invitación pendiente */}
        {alreadyPending && !result && (
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-admin-text font-body">
                {t('admin.users.invite.alreadyPending')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-fiesta-magenta text-white text-sm font-body font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <RefreshCw size={14} />
                {t('admin.users.invite.resend')}
              </button>
              <button
                type="button"
                onClick={() => setAlreadyPending(false)}
                className="flex-1 py-2.5 rounded-xl bg-admin-elevated text-admin-text text-sm font-body font-bold hover:bg-admin-border transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}

        {/* Link listo */}
        {result && (
          <div className="px-5 py-5 space-y-4">
            <p className="text-sm text-admin-muted font-body">{linkMessage}</p>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-admin-elevated border border-admin-border">
              <p className="flex-1 text-xs text-admin-text font-body font-bold break-all">
                {result.inviteUrl}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-admin-card transition-colors text-admin-muted shrink-0"
                aria-label={t('admin.users.invite.linkCopied')}
              >
                {copied
                  ? <Check size={14} className="text-emerald-500" />
                  : <Copy size={14} />
                }
              </button>
            </div>

            {copied && (
              <p role="status" className="text-xs text-emerald-500 font-body">{t('admin.users.invite.linkCopied')}</p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-admin-elevated text-admin-text text-sm font-body font-bold hover:bg-admin-border transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
