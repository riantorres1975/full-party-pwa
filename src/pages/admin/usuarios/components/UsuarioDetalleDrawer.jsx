import { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { usePermission } from '../../../../hooks/usePermission';
import RoleBadge from '../../../../components/admin/RoleBadge';
import ChangeRoleDropdown from './ChangeRoleDropdown';

function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
}

export default function UsuarioDetalleDrawer({ usuario, onClose, onUpdateRole, onToggleActivo }) {
  const { t } = useLanguage();
  const { user: currentUser } = usePermissions();
  const canManage = usePermission('usuarios.manage');
  const isSelf = usuario?.id === currentUser?.id;

  useEffect(() => {
    if (!usuario) return;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [usuario, onClose]);

  if (!usuario) return null;

  const initials = (usuario.nombre || usuario.email || '?').charAt(0).toUpperCase();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={usuario.email}
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-admin-card border-l border-admin-border shadow-elevated z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
          <h2 className="font-display font-black text-lg text-admin-text">{t('usuarios.changeRole')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-admin-muted hover:bg-admin-elevated transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Avatar + identidad */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center text-white font-display text-xl shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-body font-bold text-admin-text truncate">
                {usuario.nombre || usuario.email?.split('@')[0]}
              </p>
              <p className="text-sm text-admin-muted truncate">{usuario.email}</p>
              <div className="mt-1">
                <RoleBadge role={usuario.role} />
              </div>
            </div>
          </div>

          {/* Cambio de rol */}
          <ChangeRoleDropdown
            currentRole={usuario.role}
            onRoleChange={(newRole) => onUpdateRole(usuario.id, newRole)}
            disabled={!canManage || isSelf}
          />

          {/* Toggle activo */}
          <div className="flex items-center justify-between py-3 border-t border-admin-border">
            <div>
              <p className="text-sm font-body font-bold text-admin-text">{t('usuarios.toggleActivo')}</p>
              <p className="text-xs text-admin-muted mt-0.5">
                {usuario.activo ? t('usuarios.active') : t('usuarios.inactive')}
              </p>
            </div>
            <button
              onClick={() => !isSelf && canManage && onToggleActivo(usuario.id, usuario.activo)}
              disabled={isSelf || !canManage}
              aria-label={t('usuarios.toggleActivo')}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                ${usuario.activo ? 'bg-emerald-500' : 'bg-admin-border'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform
                  ${usuario.activo ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Stats */}
          <div className="border-t border-admin-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-admin-muted font-body">{t('usuarios.created')}</span>
              <span className="text-admin-text font-body">{formatDate(usuario.created_at)}</span>
            </div>
          </div>

          {/* Self-protection notice */}
          {isSelf && (
            <p className="text-xs text-admin-muted bg-admin-elevated rounded-lg px-3 py-2">
              {t('usuarios.selfProtection')}
            </p>
          )}
        </div>

        {/* Footer — eliminar */}
        {canManage && !isSelf && (
          <div className="px-5 py-4 border-t border-admin-border">
            <p className="text-xs text-admin-muted mb-3">
              La eliminación completa requiere acción en Supabase Dashboard (auth.users).
            </p>
            <button
              onClick={() => {
                if (window.confirm(t('usuarios.deleteUser') + '?')) {
                  onToggleActivo(usuario.id, true);
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-bold text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              {t('usuarios.deleteUser')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
