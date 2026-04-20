import { ROLE_LABELS, ROLE_LABELS_EN } from '../../lib/roles';
import { useLanguage } from '../../hooks/useLanguage';

const VARIANTS = {
  admin:    'bg-fiesta-magenta/15 text-fiesta-magenta',
  manager:  'bg-blue-500/15 text-blue-500',
  empleado: 'bg-emerald-500/15 text-emerald-500',
  viewer:   'bg-admin-elevated text-admin-muted',
};

export default function RoleBadge({ role }) {
  const { language } = useLanguage();
  const labels = language === 'en' ? ROLE_LABELS_EN : ROLE_LABELS;
  const label = labels[role] ?? role;
  const variant = VARIANTS[role] ?? VARIANTS.viewer;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-bold ${variant}`}>
      {label}
    </span>
  );
}
