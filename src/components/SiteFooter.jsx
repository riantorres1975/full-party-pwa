/**
 * SiteFooter.jsx — Footer oscuro compartido del sitio público.
 * Usado por SiteLayout (páginas informativas) y por el catálogo (App.jsx).
 * La landing mantiene su propio footer con analytics en LandingPage.jsx.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Clock, MessageCircle } from 'lucide-react';
import { WaIcon, FbIcon, TikTokIcon } from './icons/SocialIcons';

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

const SECCIONES = [
  { label: 'Catálogo',               href: '/catalogo'      },
  { label: 'Categorías destacadas',  href: '/destacados'    },
  { label: 'Sucursales',             href: '/sucursales'    },
  { label: '¿Cómo hacer un pedido?', href: '/como-funciona' },
  { label: 'Blog',                   href: '/blog'          },
];

const socialBtnClass =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-transform hover:scale-[1.03]';

export default function SiteFooter({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (link) => {
    if (link.route) {
      navigate(link.href);
    } else if (location.pathname === '/') {
      const id = link.href.replace('/#', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <footer className={`lp-footer ${className}`.trim()}>
      <div className="max-w-5xl mx-auto px-5 pt-10 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Col 1: Logo + tagline + redes */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/icons/icon-48.png" alt={ENV.negocio} width="32" height="32" className="w-8 h-8 rounded-lg" />
            <span
              className="font-display text-base"
              style={{
                background:           'linear-gradient(135deg, #F472B6, #C084FC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }}
            >
              {ENV.negocio}
            </span>
          </div>
          <p className="lp-footer-text text-xs leading-relaxed mb-4">
            Distribuidora de artículos para fiesta en Uruapan, Michoacán. +500 productos al mayoreo y menudeo. Envíos a todo México.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={socialBtnClass}
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
                className={socialBtnClass}
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
                className={socialBtnClass}
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
                className={socialBtnClass}
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
          <h3 className="lp-footer-heading font-display text-sm mb-4">Navegación</h3>
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(l => (
              <li key={l.label}>
                <button
                  onClick={() => handleNav(l)}
                  className="lp-footer-link text-xs font-bold text-left"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Secciones */}
        <div>
          <h3 className="lp-footer-heading font-display text-sm mb-4">Secciones</h3>
          <ul className="flex flex-col gap-2">
            {SECCIONES.map(l => (
              <li key={l.label}>
                <Link to={l.href} className="lp-footer-link text-xs font-bold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Contacto */}
        <div>
          <h3 className="lp-footer-heading font-display text-sm mb-4">Contacto</h3>
          <ul className="lp-footer-text flex flex-col gap-3 text-xs">
            <li className="flex items-start gap-2">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#F472B6' }} aria-hidden="true" />
              <span>
                <span className="font-bold" style={{ color: '#ede7fb' }}>Suc. Francisco Villa</span><br />
                C. Francisco Villa 103, Centro<br />
                <Clock size={10} className="inline mr-0.5" aria-hidden="true" />Lun–Sáb 9am–7pm
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#C084FC' }} aria-hidden="true" />
              <span>
                <span className="font-bold" style={{ color: '#ede7fb' }}>Suc. Sol Naciente</span><br />
                Universo 117, Sol Naciente<br />
                <Clock size={10} className="inline mr-0.5" aria-hidden="true" />Lun–Sáb 9am–7pm · Dom 9am–2pm
              </span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={12} style={{ color: '#F472B6' }} aria-hidden="true" />
              <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="lp-footer-link font-bold">
                WhatsApp: 452 104 0377
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="lp-footer-bottom px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <span>© {new Date().getFullYear()} {ENV.negocio} · Uruapan, Michoacán · Todos los derechos reservados</span>
        <div className="flex gap-4">
          <Link to="/catalogo" className="lp-footer-link font-bold">Catálogo</Link>
          <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="lp-footer-link font-bold">WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}
