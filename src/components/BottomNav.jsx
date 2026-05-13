import { Grid3X3, Home, Search, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

function NavButton({ active, icon: Icon, label, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
      style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative">
        <Icon className="h-5 w-5" strokeWidth={active ? 2.7 : 2.2} />
        {badge > 0 && (
          <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ffe55c] px-1 text-[9px] font-body font-black leading-none text-[#4b1d7a] shadow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-body font-black leading-none">{label}</span>
      {active && (
        <span
          className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
          style={{ background: 'var(--accent-primary)' }}
        />
      )}
    </button>
  );
}

export default function BottomNav({
  active = 'inicio',
  cantidadTotal = 0,
  onInicio,
  onCategorias,
  onBuscar,
  onPedido,
}) {
  const { t } = useLanguage();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      style={{
        background: 'var(--surface-card-alpha80)',
        borderColor: 'var(--border-soft)',
        backdropFilter: 'blur(18px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label={t('bottomNav.label')}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around">
        <NavButton
          active={active === 'inicio'}
          icon={Home}
          label={t('bottomNav.home')}
          onClick={onInicio}
        />
        <NavButton
          active={active === 'categorias'}
          icon={Grid3X3}
          label={t('bottomNav.categories')}
          onClick={onCategorias}
        />
        <NavButton
          active={active === 'buscar'}
          icon={Search}
          label={t('bottomNav.search')}
          onClick={onBuscar}
        />
        <NavButton
          active={active === 'pedido'}
          icon={ShoppingBag}
          label={t('bottomNav.order')}
          badge={cantidadTotal}
          onClick={onPedido}
        />
      </div>
    </nav>
  );
}
