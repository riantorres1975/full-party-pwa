import { Link, useLocation } from 'react-router-dom';

export default function SidebarItem({ href, icon: Icon, label, badge, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex min-h-10 items-center gap-2.5 rounded-lg transition-colors duration-200 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-fiesta-magenta ${collapsed ? 'justify-center' : 'px-3 py-2.5'}
        ${isActive
          ? 'bg-admin-elevated text-admin-text ring-1 ring-inset ring-admin-border'
          : 'text-admin-text-secondary hover:text-admin-text hover:bg-admin-elevated'
        }`}
    >
      <Icon size={18} aria-hidden="true" className="flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-sm font-body font-bold">{label}</span>
          {badge > 0 && (
            <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge > 0 && (
        <span className="absolute -right-1 -top-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
