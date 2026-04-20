import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, RefreshCw, Bell, User, Sun, Moon, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAdminData } from '../../contexts/AdminDataContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ROLE_LABELS } from '../../lib/roles';

export default function UserMenu({ user, onSignOut, temaOscuro, onToggleTema, collapsed }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const { role } = usePermissions();
  const {
    fetchPedidos,
    notificationPermission,
    requestNotificationPermission,
    testNotification,
  } = useAdminData();

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    if (collapsed) {
      // Opens to the right of the avatar, bottom-aligned
      setCoords({
        top: rect.bottom - 8,
        left: rect.right + 8,
        width: 220,
        anchor: 'right',
      });
    } else {
      // Opens upward, aligned with the button
      setCoords({
        top: rect.top - 8,
        left: rect.left,
        width: rect.width,
        anchor: 'up',
      });
    }
  }, [isOpen, collapsed]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    function handleResize() {
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const notificationsEnabled = notificationPermission === 'granted';

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
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

  const menuStyle = coords.anchor === 'up'
    ? { position: 'fixed', bottom: `calc(100vh - ${coords.top}px)`, left: coords.left, minWidth: Math.max(coords.width, 220) }
    : { position: 'fixed', top: coords.top, left: coords.left, width: coords.width, transform: 'translateY(-100%)' };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-admin-elevated transition-colors cursor-pointer ${isOpen ? 'bg-admin-elevated' : ''}`}
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

      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ ...menuStyle, zIndex: 9999 }}
          className="bg-admin-card border border-admin-border rounded-xl shadow-elevated py-1 overflow-hidden"
        >
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

          <button
            onClick={() => { onToggleTema?.(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
          >
            {temaOscuro ? <Sun size={14} /> : <Moon size={14} />}
            <span className="flex-1 text-left">
              {temaOscuro ? t('common.lightMode') : t('common.darkMode')}
            </span>
          </button>

          <button
            onClick={() => { fetchPedidos(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
          >
            <RefreshCw size={14} />
            <span className="flex-1 text-left">{t('admin.reloadData')}</span>
          </button>

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

          <div className="border-t border-admin-border my-1" />

          <button
            onClick={() => { onSignOut?.(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span className="flex-1 text-left">{t('login.signOut')}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
