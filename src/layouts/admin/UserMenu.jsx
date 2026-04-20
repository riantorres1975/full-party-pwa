import { useState, useRef, useEffect } from 'react';
import { LogOut, RefreshCw, Bell, User, Sun, Moon, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAdminData } from '../../contexts/AdminDataContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ROLE_LABELS } from '../../lib/roles';

export default function UserMenu({ user, onSignOut, temaOscuro, onToggleTema, collapsed }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { role } = usePermissions();
  const {
    fetchPedidos,
    notificationPermission,
    requestNotificationPermission,
    testNotification,
  } = useAdminData();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const notificationsEnabled = notificationPermission === 'granted';

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Already enabled — show test notification
      await testNotification();
    } else {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        await testNotification();
      }
    }
    setIsOpen(false);
  };

  const notifLabel = notificationsEnabled
    ? t('admin.notifications.enabled')
    : notificationPermission === 'denied'
      ? t('admin.notifications.blocked')
      : notificationPermission === 'insecure'
        ? t('admin.notifications.insecure')
        : notificationPermission === 'unsupported'
          ? t('admin.notifications.unsupported')
          : t('admin.notifications.enable');

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar trigger — full width */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-admin-elevated transition-colors ${isOpen ? 'bg-admin-elevated' : ''}`}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center text-white text-xs font-body font-bold shrink-0">
          {user?.email?.charAt(0).toUpperCase() || 'A'}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 flex flex-col items-start min-w-0">
              <p className="text-xs font-body font-bold text-admin-text truncate max-w-full">{user?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-[10px] font-body text-admin-muted truncate max-w-full">{role ? ROLE_LABELS[role] : 'Admin'}</p>
            </div>
            <ChevronUp
              size={14}
              className={`text-admin-muted shrink-0 transition-transform ${isOpen ? '' : 'rotate-180'}`}
            />
          </>
        )}
      </button>

      {/* Dropdown menu — opens UPWARD since UserMenu is at sidebar footer */}
      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 min-w-[200px] bg-admin-card border border-admin-border rounded-xl shadow-elevated z-50 py-1 overflow-hidden"
        >
          {/* Perfil (disabled — Próximamente) */}
          <button
            disabled
            title={t('admin.comingSoon')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-inactive cursor-not-allowed"
          >
            <User size={14} />
            <span className="flex-1 text-left">{t('admin.userMenu.profile') || 'Perfil'}</span>
            <span className="text-[9px] font-body uppercase tracking-wide text-admin-muted">
              {t('admin.comingSoon')}
            </span>
          </button>

          {/* Cambiar tema */}
          <button
            onClick={() => { onToggleTema?.(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
          >
            {temaOscuro ? <Sun size={14} /> : <Moon size={14} />}
            <span className="flex-1 text-left">
              {temaOscuro ? t('common.lightMode') : t('common.darkMode')}
            </span>
          </button>

          {/* Recargar datos */}
          <button
            onClick={() => {
              fetchPedidos();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
          >
            <RefreshCw size={14} />
            <span className="flex-1 text-left">{t('admin.reloadData')}</span>
          </button>

          {/* Notificaciones */}
          <button
            onClick={handleToggleNotifications}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
            title={notifLabel}
          >
            <Bell size={14} />
            <span className="flex-1 text-left truncate">{notifLabel}</span>
            <span
              className={`shrink-0 w-7 h-4 rounded-full transition-colors ${notificationsEnabled ? 'bg-emerald-500' : 'bg-admin-border'}`}
              aria-hidden="true"
            >
              <span
                className={`block w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${notificationsEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`}
              />
            </span>
          </button>

          {/* Separador */}
          <div className="border-t border-admin-border my-1" />

          {/* Cerrar sesión */}
          <button
            onClick={() => {
              onSignOut?.();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span className="flex-1 text-left">{t('login.signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
