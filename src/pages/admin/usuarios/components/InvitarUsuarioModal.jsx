import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { ROLES, ROLE_LABELS, ROLE_LABELS_EN } from '../../../../lib/roles';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useInvitarUsuario } from '../hooks/useInvitarUsuario';

const ROLE_ORDER = [ROLES.EMPLEADO, ROLES.MANAGER, ROLES.VIEWER, ROLES.ADMIN];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InvitarUsuarioModal({ onClose, onInvited }) {
  const { t, language } = useLanguage();
  const { invitar } = useInvitarUsuario();
  const labels = language === 'en' ? ROLE_LABELS_EN : ROLE_LABELS;

  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.EMPLEADO);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError(t('usuarios.invite.emailInvalid'));
      return;
    }
    setEmailError('');
    setLoading(true);
    const result = await invitar(email.trim().toLowerCase(), role);
    setLoading(false);
    if (result.ok) {
      setLoginUrl(result.loginUrl);
      onInvited?.();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-admin-card border border-admin-border rounded-2xl shadow-elevated w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
          <h2 className="font-display font-black text-lg text-admin-text">{t('usuarios.invite.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-admin-muted hover:bg-admin-elevated transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {!loginUrl ? (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide">
                {t('usuarios.invite.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="ejemplo@correo.com"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40"
              />
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
            </div>

            {/* Rol inicial */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide">
                {t('usuarios.invite.role')}
              </label>
              <select
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
        ) : (
          /* Resultado: link de acceso */
          <div className="px-5 py-5 space-y-4">
            <p className="text-sm text-admin-text font-body">{t('admin.users.inviteLink')}:</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-admin-elevated border border-admin-border">
              <p className="flex-1 text-xs text-admin-muted font-body truncate">{loginUrl}</p>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-admin-card transition-colors text-admin-muted"
                aria-label={t('admin.users.inviteCopied')}
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-xs text-admin-muted">
              {t('usuarios.invite.role')}: <strong className="text-admin-text">{labels[role]}</strong>
            </p>
            <button
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
