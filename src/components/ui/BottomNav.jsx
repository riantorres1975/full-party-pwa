import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, LayoutGrid, LogOut, MoreHorizontal, Home, Users, Sun, Moon, RefreshCw, Bell, User, Settings } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { usePermission } from '../../hooks/usePermission';
import { useAdminData } from '../../contexts/AdminDataContext';
import ConfirmModal from './ConfirmModal';

const ROUTE_MAP = {
  pedidos: '/admin/pedidos',
  catalogo: '/admin/catalogo',
  dashboard: '/admin/dashboard',
  clientes: '/admin/clientes',
};

export default function BottomNav({ onSignOut }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    contadores,
    fetchPedidos,
    notificationPermission,
    requestNotificationPermission,
    testNotification,
  } = useAdminData();

  const canViewDashboard = usePermission('reportes.view');
  const canViewClients = usePermission('clientes.view');

  const badge = contadores?.['Por Surtir'] ?? 0;
  const notificationsEnabled = notificationPermission === 'granted';

  const active = location.pathname.startsWith('/admin/pedidos') ? 'pedidos'
    : location.pathname.startsWith('/admin/catalogo') ? 'catalogo'
    : location.pathname.startsWith('/admin/dashboard') ? 'dashboard'
    : location.pathname.startsWith('/admin/clientes') ? 'clientes'
    : null;

  const MAIN_TABS = [
    { key: 'pedidos', label: t('admin.nav.orders'), icon: ClipboardList },
    { key: 'catalogo', label: t('admin.nav.catalog'), icon: LayoutGrid },
    { key: 'more', label: t('common.more') || 'Más', icon: MoreHorizontal },
  ];

  const handleMenuClick = (key) => {
    setSheetOpen(false);
    if (key === 'salir') {
      setConfirmOpen(true);
    } else if (key === 'theme') {
      toggleTheme();
    } else if (key === 'reload') {
      fetchPedidos();
    } else if (key === 'notifications') {
      if (notificationsEnabled) {
        testNotification();
      } else {
        requestNotificationPermission().then(p => {
          if (p === 'granted') testNotification();
        });
      }
    } else if (ROUTE_MAP[key]) {
      navigate(ROUTE_MAP[key]);
    }
  };

  const notifLabel = notificationsEnabled
    ? t('admin.notifications.enabled')
    : notificationPermission === 'denied'
      ? t('admin.notifications.blocked')
      : t('admin.notifications.enable');

  return (
    <>
    <ConfirmModal
      open={confirmOpen}
      title={t('admin.logout.title')}
      message={t('admin.logout.message')}
      confirmLabel={t('admin.logout.confirm')}
      variant="warning"
      onConfirm={() => { setConfirmOpen(false); onSignOut?.(); }}
      onCancel={() => setConfirmOpen(false)}
    />
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-admin-card/90 backdrop-blur-lg border-t border-admin-border safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={t('admin.sections')}
    >
      <div className="flex items-center justify-around h-14">
        {MAIN_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active && key !== 'more';
          const handleClick = () => {
            if (key === 'more') {
              setSheetOpen(true);
            } else {
              handleMenuClick(key);
            }
          };

          return (
            <button
              key={key}
              type="button"
              onClick={handleClick}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-14 transition-colors
                         ${isActive ? 'text-admin-text' : 'text-admin-muted'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-body font-bold">{label}</span>
              {key === 'pedidos' && badge > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-1 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-fiesta-magenta" />
              )}
            </button>
          );
        })}
      </div>
    </nav>

    {/* Bottom sheet — "Más" */}
    {sheetOpen && (
      <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        />
        {/* Sheet */}
        <div
          className="absolute bottom-0 inset-x-0 bg-admin-card border-t border-admin-border rounded-t-2xl shadow-elevated overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-admin-border" />
          </div>

          <div className="px-2 pb-2">
            {/* Perfil (disabled) */}
            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-inactive cursor-not-allowed rounded-lg"
            >
              <User size={18} />
              <span className="flex-1 text-left">{t('admin.userMenu.profile') || 'Perfil'}</span>
              <span className="text-[10px] font-body uppercase tracking-wide text-admin-muted">
                {t('admin.comingSoon')}
              </span>
            </button>

            {/* Sections — navigation */}
            {canViewDashboard && (
              <button
                onClick={() => handleMenuClick('dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors rounded-lg"
              >
                <Home size={18} />
                <span className="flex-1 text-left">{t('admin.nav.dashboard')}</span>
              </button>
            )}
            {canViewClients && (
              <button
                onClick={() => handleMenuClick('clientes')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors rounded-lg"
              >
                <Users size={18} />
                <span className="flex-1 text-left">{t('admin.nav.clients')}</span>
              </button>
            )}

            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-inactive cursor-not-allowed rounded-lg"
              title={t('admin.comingSoon')}
            >
              <Settings size={18} />
              <span className="flex-1 text-left">{t('admin.nav.settings')}</span>
              <span className="text-[10px] font-body uppercase tracking-wide text-admin-muted">
                {t('admin.comingSoon')}
              </span>
            </button>

            <div className="border-t border-admin-border my-1" />

            {/* Theme toggle */}
            <button
              onClick={() => handleMenuClick('theme')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors rounded-lg"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="flex-1 text-left">
                {isDarkMode ? t('common.lightMode') : t('common.darkMode')}
              </span>
            </button>

            {/* Reload data */}
            <button
              onClick={() => handleMenuClick('reload')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors rounded-lg"
            >
              <RefreshCw size={18} />
              <span className="flex-1 text-left">{t('admin.reloadData')}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleMenuClick('notifications')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors rounded-lg"
            >
              <Bell size={18} />
              <span className="flex-1 text-left truncate">{notifLabel}</span>
              <span
                className={`shrink-0 w-8 h-4 rounded-full transition-colors ${notificationsEnabled ? 'bg-emerald-500' : 'bg-admin-border'}`}
                aria-hidden="true"
              >
                <span
                  className={`block w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </span>
            </button>

            <div className="border-t border-admin-border my-1" />

            {/* Sign out */}
            <button
              onClick={() => handleMenuClick('salir')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-bold text-red-500 hover:bg-red-500/10 transition-colors rounded-lg"
            >
              <LogOut size={18} />
              <span className="flex-1 text-left">{t('admin.nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
