import { useState } from 'react';
import { ClipboardList, LayoutGrid, LogOut, MoreVertical, Home, Users, Settings, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { usePermission } from '../../hooks/usePermission';
import ConfirmModal from './ConfirmModal';

export default function BottomNav({ active, onChange, badge = 0, onSignOut }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const canViewDashboard = usePermission('reportes.view');
  const canViewClients = usePermission('clientes.view');

  const MAIN_TABS = [
    { key: 'pedidos', label: t('admin.nav.orders'), icon: ClipboardList },
    { key: 'catalogo', label: t('admin.nav.catalog'), icon: LayoutGrid },
    { key: 'more', label: t('common.more') || 'Más', icon: MoreVertical },
  ];

  const MORE_ITEMS = [
    canViewDashboard && { key: 'dashboard', label: t('admin.nav.dashboard'), icon: Home },
    canViewClients && { key: 'clientes', label: t('admin.nav.clients'), icon: Users },
    { key: 'settings', label: t('admin.nav.settings') || 'Configuración', icon: Settings },
    { key: 'theme', label: isDark ? t('common.lightMode') || 'Modo claro' : t('common.darkMode') || 'Modo oscuro', icon: isDark ? Sun : Moon },
    { key: 'salir', label: t('admin.nav.logout'), icon: LogOut },
  ].filter(Boolean);

  const handleMenuClick = (key) => {
    setMoreMenuOpen(false);
    if (key === 'salir') {
      setConfirmOpen(true);
    } else if (key === 'theme') {
      toggleTheme();
    } else {
      onChange(key);
    }
  };

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
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-14">
        {MAIN_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active && key !== 'more';
          const handleClick = () => {
            if (key === 'more') {
              setMoreMenuOpen(!moreMenuOpen);
            } else {
              handleMenuClick(key);
            }
          };

          return (
            <div key={key} className="relative">
              <button
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
                  <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-fiesta-magenta" />
                )}
              </button>

              {/* More menu popover */}
              {key === 'more' && moreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMoreMenuOpen(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-admin-card border border-admin-border rounded-lg shadow-lg z-20">
                    {MORE_ITEMS.map(item => (
                      <button
                        key={item.key}
                        onClick={() => handleMenuClick(item.key)}
                        className="w-full text-left px-4 py-3 text-xs font-body font-semibold text-admin-text hover:bg-admin-elevated transition-colors flex items-center gap-2 border-b border-admin-border last:border-0"
                      >
                        <item.icon size={16} className="text-admin-muted" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </nav>
    </>
  );
}
