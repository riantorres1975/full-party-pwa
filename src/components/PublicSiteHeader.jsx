import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { C } from '../styles/tokens';
import { WaIcon } from './icons/SocialIcons';
import Button from './ui/Button';
import { trackEvent } from '../utils/analytics';
import './PublicSiteHeader.css';

const BUSINESS_NAME = import.meta.env.VITE_NOMBRE_NEGOCIO || 'Full Party';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5214521040377';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, vi su página web y quiero ayuda para cotizar un pedido')}`;

const NAV_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Destacados', href: '/destacados' },
  { label: 'Cómo comprar', href: '/como-funciona' },
  { label: 'Sucursales', href: '/sucursales' },
  { label: 'Blog', href: '/blog' },
];

export default function PublicSiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="lp-main-nav sticky top-0 z-50" aria-label="Navegación principal">
      <div className="lp-main-nav-inner max-w-6xl mx-auto px-5 flex items-center justify-between">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-3 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        >
          <img
            src="/icons/icon-192.png"
            alt={`${BUSINESS_NAME} logo`}
            width="44"
            height="44"
            className="w-11 h-11 rounded-xl flex-shrink-0"
            style={{ boxShadow: `0 4px 12px ${C.pink}44` }}
          />
          <div className="lp-main-nav-brand min-w-0 leading-none">
            <span className="lp-main-nav-title font-display text-2xl block">
              <span className="lp-brand-full">Full</span>
              <span className="lp-brand-party">Party</span>
            </span>
            <span className="lp-main-nav-subtitle text-[10px] font-black tracking-widest uppercase">
              Mayoreo · Uruapan
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              className={({ isActive }) => `lp-nav-link px-3 py-2 whitespace-nowrap text-xs${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          <Button
            variant="outline"
            size="sm"
            as="a"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            iconLeft={<WaIcon size={13} />}
            className="lp-nav-whatsapp ml-2 whitespace-nowrap"
            onClick={() => trackEvent('nav_whatsapp_click')}
          >
            WhatsApp
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-xl flex-shrink-0"
          style={{ background: C.surfaceLavender, color: C.purple }}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="public-site-mobile-menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="public-site-mobile-menu"
          className="lg:hidden border-t bg-white px-5 py-4 flex flex-col gap-1"
          style={{ borderColor: C.borderSoft }}
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              onClick={closeMenu}
              className={({ isActive }) => `lp-mobile-nav-link text-left px-4 py-3 rounded-xl text-sm font-black transition-all hover:bg-purple-50${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          <Button
            variant="primary"
            size="md"
            as="a"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            iconLeft={<WaIcon size={14} />}
            fullWidth
            className="lp-nav-whatsapp mt-1"
            onClick={() => {
              closeMenu();
              trackEvent('nav_whatsapp_click');
            }}
          >
            Contactar por WhatsApp
          </Button>
        </div>
      )}
    </nav>
  );
}
