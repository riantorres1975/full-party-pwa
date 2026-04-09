import { ClipboardList, LayoutGrid, User } from 'lucide-react';

const TABS = [
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { key: 'catalogo', label: 'Catálogo', icon: LayoutGrid },
  { key: 'cuenta', label: 'Cuenta', icon: User },
];

export default function BottomNav({ active, onChange, badge = 0, onCuenta }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-admin-card/90 backdrop-blur-lg border-t border-admin-border safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-14">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active || (key === 'cuenta' && active === 'cuenta');
          const handleClick = () => {
            if (key === 'cuenta') {
              onCuenta?.();
            } else {
              onChange(key);
            }
          };

          return (
            <button
              key={key}
              type="button"
              onClick={handleClick}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors
                         ${isActive ? 'text-admin-text' : 'text-admin-muted'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-body font-bold">{label}</span>
              {/* Badge */}
              {key === 'pedidos' && badge > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-1 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-fiesta-magenta" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
