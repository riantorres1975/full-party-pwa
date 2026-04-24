import { ClipboardList, LayoutGrid, Users, CreditCard, Package, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAdminData } from '../../contexts/AdminDataContext';
import { usePermission } from '../../hooks/usePermission';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';
import UserMenu from './UserMenu';

export default function Sidebar({ user, collapsed, onToggle, onSignOut, temaOscuro, onToggleTema }) {
  const { t } = useLanguage();
  const { contadores } = useAdminData();
  const canViewOrders = usePermission('pedidos.view');
  const canViewCatalog = usePermission('catalogo.view');
  const canViewReports = usePermission('reportes.view');
  const canViewClients = usePermission('clientes.view');
  const canViewUsers = usePermission('usuarios.view');

  const disabledTooltip = t('admin.comingSoon');

  return (
    <div className="flex flex-col h-full bg-admin-card">
      {/* Brand + collapse button */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-admin-border">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center shrink-0 text-white font-display text-sm">
              FP
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg text-admin-text leading-tight">Full Party</h1>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center p-1.5 rounded-lg text-admin-muted hover:bg-admin-elevated transition-colors"
          title={collapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label={t('admin.layout.sidebar')}>
        {/* PRINCIPAL */}
        <SidebarSection label={t('admin.section.main')} collapsed={collapsed}>
          <SidebarItem
            href="/admin/pedidos"
            icon={ClipboardList}
            label={t('admin.nav.orders')}
            badge={contadores['Por Surtir'] > 0 ? contadores['Por Surtir'] : null}
            disabled={!canViewOrders}
            tooltip={!canViewOrders ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/admin/dashboard"
            icon={BarChart3}
            label={t('admin.nav.dashboard')}
            disabled={!canViewReports}
            tooltip={!canViewReports ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
        </SidebarSection>

        {/* COMERCIAL */}
        <SidebarSection label={t('admin.section.commercial')} collapsed={collapsed}>
          <SidebarItem
            href="/admin/clientes"
            icon={Users}
            label={t('admin.nav.clients')}
            disabled={!canViewClients}
            tooltip={!canViewClients ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/admin/pagos"
            icon={CreditCard}
            label={t('admin.nav.payments')}
            disabled={!canViewClients}
            tooltip={!canViewClients ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
        </SidebarSection>

        {/* CATÁLOGO */}
        <SidebarSection label={t('admin.section.catalog')} collapsed={collapsed}>
          <SidebarItem
            href="/admin/catalogo"
            icon={LayoutGrid}
            label={t('admin.nav.catalog')}
            disabled={!canViewCatalog}
            tooltip={!canViewCatalog ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/admin/inventario"
            icon={Package}
            label={t('admin.nav.inventory')}
            disabled={!canViewCatalog}
            tooltip={!canViewCatalog ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
        </SidebarSection>

        {/* ANÁLISIS */}
        <SidebarSection label={t('admin.section.analytics')} collapsed={collapsed}>
          <SidebarItem
            href="/admin/reportes"
            icon={BarChart3}
            label={t('admin.nav.reports')}
            disabled={!canViewReports}
            tooltip={!canViewReports ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
        </SidebarSection>

        {/* CONFIGURACIÓN */}
        <SidebarSection label={t('admin.section.settings')} collapsed={collapsed}>
          <SidebarItem
            href="/admin/usuarios"
            icon={Users}
            label={t('admin.nav.users')}
            disabled={!canViewUsers}
            tooltip={!canViewUsers ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/admin/tienda"
            icon={Settings}
            label={t('admin.nav.store')}
            disabled={!canViewUsers}
            tooltip={!canViewUsers ? t('admin.noPermission') : undefined}
            collapsed={collapsed}
          />
        </SidebarSection>
      </nav>

      {/* User menu — footer */}
      <div className="border-t border-admin-border p-3">
        <UserMenu
          user={user}
          onSignOut={onSignOut}
          temaOscuro={temaOscuro}
          onToggleTema={onToggleTema}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}
