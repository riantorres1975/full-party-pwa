import { useState } from 'react';
import BottomNav from '../components/ui/BottomNav';
import { useToast } from '../components/ui/ToastProvider';
import { useConfirm } from '../hooks/useConfirm';
import { useLanguage } from '../hooks/useLanguage';
import ConfirmModal from '../components/ui/ConfirmModal';
import Sidebar from './admin/Sidebar';
import Topbar from './admin/Topbar';
import { AdminDataProvider } from '../contexts/AdminDataContext';
import { BreadcrumbProvider } from '../contexts/BreadcrumbContext';
import { PermissionsProvider, usePermissions } from '../contexts/PermissionsContext';

function PermissionsGate({ children, onSignOut }) {
  const { loading, role } = usePermissions();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
      </div>
    );
  }

  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center space-y-3 p-8 max-w-sm">
          <p className="text-lg font-bold text-admin-text">{t('admin.users.deactivated.title')}</p>
          <p className="text-sm text-admin-muted">{t('admin.users.deactivated.desc')}</p>
          <button
            onClick={onSignOut}
            className="text-sm underline text-fiesta-magenta hover:opacity-75 transition-opacity"
          >
            {t('login.signOut')}
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default function AdminLayout({ user, temaOscuro, onToggleTema, onSignOut, children }) {
  const { t } = useLanguage();
  const toast = useToast();
  const { isOpen: cancelConfirmOpen, config: cancelConfig, confirm: confirmCancelar, onConfirm: onConfirmCancelar, onCancel: onCancelCancelar } = useConfirm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('admin.sidebar.collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    try {
      localStorage.setItem('admin.sidebar.collapsed', String(newState));
    } catch {}
  };

  return (
    <PermissionsProvider user={user}>
      <PermissionsGate onSignOut={onSignOut}>
      <AdminDataProvider toast={toast} confirmCancelar={confirmCancelar}>
        <BreadcrumbProvider>
        <div className="flex flex-col h-screen bg-admin-bg lg:flex-row">
          <ConfirmModal
            open={cancelConfirmOpen}
            {...cancelConfig}
            onConfirm={onConfirmCancelar}
            onCancel={onCancelCancelar}
          />

          {/* Skip link */}
          <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-admin-card focus:text-admin-text focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-elevated focus:text-sm focus:font-body focus:font-bold">
            {t('admin.skipToContent')}
          </a>

          {/* Sidebar — desktop only */}
          <aside
            className={`hidden lg:flex lg:flex-col lg:h-full lg:flex-shrink-0 lg:border-r border-admin-border transition-[width] duration-200 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'}`}
            style={{ backgroundColor: 'var(--admin-card)' }}
          >
            <Sidebar
              user={user}
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              onSignOut={onSignOut}
              temaOscuro={temaOscuro}
              onToggleTema={onToggleTema}
            />
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Topbar */}
            <Topbar />

            {/* Page content */}
            <main id="admin-main" className="flex-1 min-w-0 overflow-y-auto">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 lg:p-5 lg:max-w-none pb-20 lg:pb-0">
                {children}
              </div>
            </main>
          </div>

          {/* Bottom nav — mobile only */}
          <div className="lg:hidden">
            <BottomNav onSignOut={onSignOut} />
          </div>
        </div>
        </BreadcrumbProvider>
      </AdminDataProvider>
      </PermissionsGate>
    </PermissionsProvider>
  );
}
