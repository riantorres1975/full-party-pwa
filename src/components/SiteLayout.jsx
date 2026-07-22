import { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Clock, MessageCircle } from 'lucide-react';

const C = {
  pink:            '#F472B6',
  purple:          '#C084FC',
  pinkText:        '#BE185D',
  purpleText:      '#7E22CE',
  cyan:            '#22D3EE',
  textHead:        '#2D0D5A',
  textBody:        '#5B3080',
  textMuted:       '#7B4FA6',
  infoBlue:        '#0369A1',
  borderSoft:      '#EDE0F8',
  surfaceLavender: '#F5EEFF',
  shadowLavender:  'rgba(192,132,252,0.1)',
};

const ENV = {
  negocio:  import.meta.env.VITE_NOMBRE_NEGOCIO  || 'Full Party',
  waNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '5214521040377',
  tiktok:   import.meta.env.VITE_TIKTOK_URL      || null,
  suc1: {
    nombre:   import.meta.env.VITE_SUC1_NOMBRE   || 'Francisco Villa',
    facebook: import.meta.env.VITE_SUC1_FACEBOOK || null,
  },
  suc2: {
    nombre:   import.meta.env.VITE_SUC2_NOMBRE   || 'Sol Naciente',
    facebook: import.meta.env.VITE_SUC2_FACEBOOK || null,
  },
};

const WA_HREF = `https://wa.me/${ENV.waNumber}?text=${encodeURIComponent('Hola, me interesa hacer un pedido 🎉')}`;

const NAV_LINKS = [
  { label: 'Inicio',        href: '/',              route: true  },
  { label: 'Catálogo',      href: '/catalogo',      route: true  },
  { label: 'Destacados',    href: '/destacados',    route: true  },
  { label: 'Cómo funciona', href: '/como-funciona', route: true  },
  { label: 'Sucursales',    href: '/sucursales',    route: true  },
  { label: 'Blog',          href: '/blog',          route: true  },
  { label: 'FAQ',           href: '/#faq',          route: false },
  { label: 'Contacto',      href: '/#contacto',     route: false },
];

function WaIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function FbIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

export default function SiteLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();

  const handleNav = useCallback((link) => {
    setMenuOpen(false);
    if (link.route) {
      navigate(link.href);
    } else {
      // Sección de landing: si ya estamos en /, scroll; si no, navega a /
      if (location.pathname === '/') {
        const id = link.href.replace('/#', '');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
      }
    }
  }, [navigate, location.pathname]);

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FEFAFF' }}>

      {/* ══ NAVBAR ═══════════════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 bg-white border-b"
        style={{ borderColor: C.borderSoft, boxShadow: `0 2px 16px ${C.shadowLavender}` }}
        aria-label="Navegación principal"
      >
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/icons/icon-64.png"
              alt={`${ENV.negocio} logo`}
              width="44"
              height="44"
              className="w-11 h-11 rounded-xl"
              style={{ boxShadow: `0 4px 12px ${C.pink}44` }}
            />
            <div className="leading-none">
              <span
                className="font-display text-2xl block"
                style={{
                  background:           `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                  backgroundClip:       'text',
                }}
              >
                {ENV.negocio}
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: C.infoBlue }}>
                Uruapan
              </span>
            </div>
          </Link>

          {/* Links desktop */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(l => (
              <button
                key={l.label}
                onClick={() => handleNav(l)}
                className="px-3 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap hover:bg-purple-50"
                style={{ color: isActive(l.href) ? C.pinkText : C.textBody }}
              >
                {l.label}
              </button>
            ))}
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white transition-transform hover:scale-[1.03] whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
            >
              <WaIcon size={13} /> WhatsApp
            </a>
          </div>

          {/* Hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl"
            style={{ background: C.surfaceLavender, color: C.purpleText }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menú mobile */}
        {menuOpen && (
          <div className="lg:hidden border-t bg-white px-5 py-4 flex flex-col gap-1" style={{ borderColor: C.borderSoft }}>
            {NAV_LINKS.map(l => (
              <button
                key={l.label}
                onClick={() => handleNav(l)}
                className="text-left px-4 py-3 rounded-xl text-sm font-black transition-all hover:bg-purple-50"
                style={{ color: isActive(l.href) ? C.pinkText : C.textBody }}
              >
                {l.label}
              </button>
            ))}
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
            >
              <WaIcon size={14} /> Contactar por WhatsApp
            </a>
          </div>
        )}
      </nav>

      {/* ══ CONTENIDO ════════════════════════════════════════ */}
      <main className="flex-1">
        {children}
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="border-t bg-white" style={{ borderColor: C.borderSoft }}>
        <div className="max-w-5xl mx-auto px-5 pt-10 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Logo + tagline + redes */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/icons/icon-48.png" alt={ENV.negocio} width="32" height="32" className="w-8 h-8 rounded-lg" />
              <span
                className="font-display text-base"
                style={{
                  background:           `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                  backgroundClip:       'text',
                }}
              >
                {ENV.negocio}
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: C.textMuted }}>
              Distribuidora de artículos para fiesta en Uruapan, Michoacán. +500 productos al mayoreo y menudeo. Envíos a todo México.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-transform hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
                aria-label="WhatsApp"
              >
                <WaIcon size={12} /> WhatsApp
              </a>
              {ENV.suc1.facebook && (
                <a
                  href={ENV.suc1.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-transform hover:scale-[1.03]"
                  style={{ background: '#1251AE' }}
                  aria-label={`Facebook Suc. ${ENV.suc1.nombre}`}
                >
                  <FbIcon size={12} /> Suc. {ENV.suc1.nombre}
                </a>
              )}
              {ENV.suc2.facebook && (
                <a
                  href={ENV.suc2.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-transform hover:scale-[1.03]"
                  style={{ background: '#1251AE' }}
                  aria-label={`Facebook Suc. ${ENV.suc2.nombre}`}
                >
                  <FbIcon size={12} /> Suc. {ENV.suc2.nombre}
                </a>
              )}
              {ENV.tiktok && (
                <a
                  href={ENV.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-transform hover:scale-[1.03]"
                  style={{ background: '#010101' }}
                  aria-label="TikTok"
                >
                  <TikTokIcon size={12} /> TikTok
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Navegación */}
          <div>
            <h3 className="font-display text-sm mb-4" style={{ color: C.textHead }}>Navegación</h3>
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map(l => (
                <li key={l.label}>
                  <button
                    onClick={() => handleNav(l)}
                    className="text-xs font-bold hover:text-pink-400 transition-colors text-left"
                    style={{ color: C.textMuted }}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Secciones */}
          <div>
            <h3 className="font-display text-sm mb-4" style={{ color: C.textHead }}>Secciones</h3>
            <ul className="flex flex-col gap-2">
              {[
                { label: 'Catálogo',               href: '/catalogo'      },
                { label: 'Categorías destacadas',   href: '/destacados'    },
                { label: 'Sucursales',              href: '/sucursales'    },
                { label: '¿Cómo hacer un pedido?',  href: '/como-funciona' },
                { label: 'Blog',                    href: '/blog'          },
              ].map(l => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-xs font-bold hover:text-pink-400 transition-colors"
                    style={{ color: C.textMuted }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contacto */}
          <div>
            <h3 className="font-display text-sm mb-4" style={{ color: C.textHead }}>Contacto</h3>
            <ul className="flex flex-col gap-3 text-xs" style={{ color: C.textMuted }}>
              <li className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: C.pink }} aria-hidden="true" />
                <span>
                  <span className="font-bold" style={{ color: C.textHead }}>Suc. Francisco Villa</span><br />
                  C. Francisco Villa 103, Centro<br />
                  <Clock size={10} className="inline mr-0.5" aria-hidden="true" />Lun–Sáb 9am–7pm
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: C.purple }} aria-hidden="true" />
                <span>
                  <span className="font-bold" style={{ color: C.textHead }}>Suc. Sol Naciente</span><br />
                  Universo 117, Sol Naciente<br />
                  <Clock size={10} className="inline mr-0.5" aria-hidden="true" />Lun–Sáb 9am–7pm · Dom 9am–2pm
                </span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={12} style={{ color: C.pink }} aria-hidden="true" />
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-colors font-bold"
                >
                  WhatsApp: 452 104 0377
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div
          className="border-t px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ borderColor: C.borderSoft, color: C.textMuted }}
        >
          <span>© {new Date().getFullYear()} {ENV.negocio} · Uruapan, Michoacán · Todos los derechos reservados</span>
          <div className="flex gap-4">
            <Link to="/catalogo" className="font-bold hover:text-pink-400 transition-colors">Catálogo</Link>
            <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="font-bold hover:text-pink-400 transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>

      {/* ══ FAB WhatsApp ═════════════════════════════════════ */}
      <aside aria-label="Contacto rápido">
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full font-black text-sm text-white w-14 h-14 sm:w-auto sm:h-auto sm:gap-2.5 sm:pl-4 sm:pr-5 sm:py-3.5 transition-transform hover:scale-[1.07]"
          style={{ background: 'linear-gradient(135deg, #25d366, #1aab56)', boxShadow: '0 6px 20px rgba(37,211,102,0.5)' }}
          aria-label="Contactar por WhatsApp"
        >
          <WaIcon size={20} />
          <span className="hidden sm:inline">¿Dudas? ¡Escríbenos!</span>
        </a>
      </aside>
    </div>
  );
}
