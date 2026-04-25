import { ROLES, ROLE_LABELS, ROLE_LABELS_EN } from '../../../../lib/roles';
import { useLanguage } from '../../../../hooks/useLanguage';

const ROLE_ORDER = [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLEADO, ROLES.VIEWER];

export default function ChangeRoleDropdown({ currentRole, onRoleChange, disabled = false }) {
  const { t, language } = useLanguage();
  const labels = language === 'en' ? ROLE_LABELS_EN : ROLE_LABELS;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide">
        {t('usuarios.changeRole')}
      </label>
      <select
        value={currentRole}
        onChange={(e) => onRoleChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ROLE_ORDER.map((role) => (
          <option key={role} value={role}>
            {labels[role]}
          </option>
        ))}
      </select>
      {disabled && (
        <p className="text-xs text-admin-muted">{t('usuarios.selfProtection')}</p>
      )}
    </div>
  );
}
