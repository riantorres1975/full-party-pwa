import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAdminData } from '../../contexts/AdminDataContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { adminNavigation } from './adminNavigation';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';
import UserMenu from './UserMenu';

const groups = ['main', 'catalog', 'commercial', 'analytics', 'settings'];

export default function Sidebar({ user, collapsed, onToggle, onSignOut, temaOscuro, onToggleTema }) {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const { contadores } = useAdminData();
  const visible = adminNavigation.filter(section => can(section.permission));
  const toggleLabel = t(collapsed ? 'admin.sidebar.expand' : 'admin.sidebar.collapse');

  return (
    <div className="flex h-full min-h-0 flex-col bg-admin-card">
      <div className={`flex min-h-16 items-center border-b border-admin-border ${collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4'}`}>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-sm font-black text-white">FP</span>
            <span className="truncate text-base font-black text-admin-text">Full Party</span>
          </div>
        )}
        <button type="button" onClick={onToggle} aria-controls="admin-sidebar-nav" aria-expanded={!collapsed} aria-label={toggleLabel} title={toggleLabel} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600">
          {collapsed ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
        </button>
      </div>

      <nav id="admin-sidebar-nav" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-2.5 py-3" aria-label={t('admin.layout.sidebar')}>
        {groups.map(group => {
          const sections = visible.filter(section => section.group === group);
          if (!sections.length) return null;
          return (
            <SidebarSection key={group} label={t(`admin.section.${group}`)} collapsed={collapsed}>
              {sections.map(section => (
                <SidebarItem key={section.key} href={section.path} icon={section.icon} label={t(section.label)} collapsed={collapsed} badge={section.key === 'pedidos' ? contadores['Por Surtir'] : null} />
              ))}
            </SidebarSection>
          );
        })}
      </nav>

      <div className="border-t border-admin-border p-3">
        <UserMenu user={user} onSignOut={onSignOut} temaOscuro={temaOscuro} onToggleTema={onToggleTema} collapsed={collapsed} />
      </div>
    </div>
  );
}
