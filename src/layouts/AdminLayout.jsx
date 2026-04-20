import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';
import { useToast } from '../components/ui/ToastProvider';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ui/ConfirmModal';
import Sidebar from './admin/Sidebar';
import Topbar from './admin/Topbar';
import { AdminDataProvider } from '../contexts/AdminDataContext';
import { BreadcrumbProvider } from '../contexts/BreadcrumbContext';
import { PermissionsProvider } from '../contexts/PermissionsContext';

export default function AdminLayout({ user, temaOscuro, onToggleTema, onSignOut, children }) {
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
      <AdminDataProvider toast={toast} confirmCancelar={confirmCancelar}>
        <BreadcrumbProvider>
        <div className="min-h-screen bg-admin-bg lg:flex lg:h-screen lg:overflow-hidden">
          <ConfirmModal
            open={cancelConfirmOpen}
            {...cancelConfig}
            onConfirm={onConfirmCancelar}
            onCancel={onCancelCancelar}
          />

          {/* Skip link */}
          <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-admin-card focus:text-admin-text focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-elevated focus:text-sm focus:font-body focus:font-bold">
            Saltar al contenido
          </a>

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:flex lg:flex-col lg:h-full lg:w-56 lg:flex-shrink-0 lg:border-r border-admin-border" style={{ backgroundColor: 'var(--admin-card)' }}>
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
          <div className="flex-1 flex flex-col lg:min-w-0 lg:overflow-hidden">
            {/* Topbar */}
            <Topbar />

            {/* Page content */}
            <main id="admin-main" className="flex-1 min-w-0 lg:overflow-y-auto">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 lg:p-5 lg:max-w-none">
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
    </PermissionsProvider>
  );
}
