import { useState, useRef, useEffect } from 'react';
import { LogOut, RefreshCw, Bell } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../hooks/useLanguage';
import { useAdminData } from '../../contexts/AdminDataContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ROLE_LABELS } from '../../lib/roles';

export default function UserMenu({ user, onSignOut, temaOscuro, onToggleTema }) {
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await testNotification();
    }
  };

  const notificationStatusLabel = notificationPermission === 'granted'
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
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-admin-elevated transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center text-white text-xs font-body font-bold shrink-0">
          {user?.email?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <p className="text-xs font-body font-bold text-admin-text truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
          <p className="text-[10px] font-body text-admin-muted truncate max-w-[120px]">{role ? ROLE_LABELS[role] : 'Admin'}</p>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-admin-card border border-admin-border rounded-xl shadow-elevated z-50 py-1">
          {/* Theme toggle */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-admin-border">
            <span className="text-xs font-body font-bold text-admin-muted">{t('admin.theme')}</span>
            <ThemeToggle isDarkMode={temaOscuro} onToggle={onToggleTema} variant="admin" />
          </div>

          {/* Refresh data */}
          <button
            onClick={() => {
              fetchPedidos();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
          >
            <RefreshCw size={14} />
            {t('admin.reloadData')}
          </button>

          {/* Notifications */}
          <button
            onClick={() => {
              handleEnableNotifications();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
            title={notificationStatusLabel}
          >
            <Bell size={14} />
            <span className="truncate">{notificationStatusLabel}</span>
          </button>

          {/* Sign out */}
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-rose-600 hover:bg-rose-50 border-t border-admin-border transition-colors"
          >
            <LogOut size={14} />
            {t('login.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
