import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, MapPin, Star, Package,
  Sparkles, ArrowRight, Menu, X, Navigation, Clock,
  BadgeCheck, Truck, Search, CircleDot, Shapes,
  PanelsTopLeft, Boxes, PartyPopper,
} from 'lucide-react';
import './LandingPage.css';
import { C } from '../styles/tokens';
import Reveal from '../components/landing/Reveal';
import GradCard from '../components/landing/GradCard';
import { WaIcon, FbIcon, TikTokIcon } from '../components/icons/SocialIcons';
import Balloon from '../components/landing/Balloon';
import SectionTitle from '../components/landing/SectionTitle';
import BranchTyper from '../components/landing/BranchTyper';
import FaqItem from '../components/landing/FaqItem';
import Button from '../components/ui/Button';
import ReviewsCarousel from '../components/landing/ReviewsCarousel';
import GaleriaCard from '../components/landing/GaleriaCard';
import BrandCard from '../components/landing/BrandCard';
import CatalogQuickLinks from '../components/landing/CatalogQuickLinks';
import { trackEvent } from '../utils/analytics';

const NovedadesSection = lazy(() => import('../components/landing/NovedadesSection'));

function NovedadesPlaceholder() {
  return (
    <section className="lp-below-fold lp-section-white lp-novedades-section px-5 pt-8 pb-16" aria-hidden="true">
      <div className="max-w-[1100px] mx-auto">
        <div className="lp-novedades-heading mb-7">
          <div className="min-w-0">
            <span
              className="lp-novedades-eyebrow inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full mb-3"
              style={{ background: `linear-gradient(135deg, ${C.pink}30, ${C.purple}25)`, color: C.pink, border: `1px solid ${C.pink}33` }}
            >
              <Sparkles size={11} aria-hidden="true" /> Recién llegados
            </span>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <h2 className="font-display text-3xl sm:text-4xl" style={{ color: C.textHead }}>
                Descubre algo nuevo
              </h2>
              <span className="lp-novedades-count inline-flex items-center gap-1.5 text-xs font-black opacity-0">
                12 productos nuevos
              </span>
            </div>
            <p className="lp-novedades-copy mt-2 text-sm sm:text-base leading-relaxed opacity-0" style={{ color: C.textBody }}>
              Productos recien llegados con opciones de menudeo y mayoreo.
            </p>
          </div>
          <span className="lp-novedades-link text-xs font-black inline-flex items-center gap-1.5 opacity-0">
            Ver todo el catalogo <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
        <div className="lp-novedades-shell">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`lp-novedad-skeleton ${item > 1 ? 'hidden sm:block' : ''}`} />
            ))}
          </div>
          <div className="lp-novedades-controls opacity-0">
            <span className="lp-novedades-arrow" />
            <span className="lp-novedades-dots">
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className="lp-novedades-dot"
                  style={{ width: item === 3 ? 22 : 7, background: `${C.pink}40` }}
                />
              ))}
            </span>
            <span className="lp-novedades-arrow" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LazyMapIframe({ src, title }) {
  const ref = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return undefined;
    if (!ref.current || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '520px 0px' },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={ref} className="w-full h-full">
      {shouldLoad ? (
        <iframe
          src={src}
          className="w-full h-full"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          title={title}
        />
      ) : (
        <div className="lp-map-placeholder w-full h-full" aria-hidden="true" />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 2. CONFIGURACIÓN — env vars y constantes globales
// ════════════════════════════════════════════════════════════
const ENV = {
  waNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '521XXXXXXXXXX',
  negocio:  import.meta.env.VITE_NOMBRE_NEGOCIO  || 'Full Party',
  horario:  import.meta.env.VITE_HORARIO_TIENDA  || 'Lun–Sáb 9am–7pm',
  tiktok:   import.meta.env.VITE_TIKTOK_URL      || null,
  suc1: {
    nombre:   import.meta.env.VITE_SUC1_NOMBRE    || 'Francisco Villa',
    badge:    import.meta.env.VITE_SUC1_BADGE     || 'Sucursal Principal',
    direccion:import.meta.env.VITE_SUC1_DIRECCION || 'Uruapan, Michoacán',
    mapsUrl:  import.meta.env.VITE_SUC1_MAPS_URL  || '#',
    facebook: import.meta.env.VITE_SUC1_FACEBOOK  || null,
  },
  suc2: {
    nombre:   import.meta.env.VITE_SUC2_NOMBRE    || 'Sol Naciente',
    badge:    import.meta.env.VITE_SUC2_BADGE     || 'Sucursal Norte',
    direccion:import.meta.env.VITE_SUC2_DIRECCION || 'Col. Sol Naciente, Uruapan, Michoacán',
    mapsUrl:  import.meta.env.VITE_SUC2_MAPS_URL  || '#',
    facebook: import.meta.env.VITE_SUC2_FACEBOOK  || null,
  },
};

const WA_HREF  = `https://wa.me/${ENV.waNumber}?text=${encodeURIComponent('Hola, vi su página web y quiero ayuda para cotizar un pedido 🎉')}`;

const NAV_LINKS = [
  { label: 'Catálogo',      href: '/catalogo',      hash: true  },
  { label: 'Destacados',    href: '/destacados',    hash: true  },
  { label: 'Cómo comprar',  href: '/como-funciona', hash: true  },
  { label: 'Sucursales',    href: '/sucursales',    hash: true  },
  { label: 'Blog',          href: '/blog',          hash: true  },
];

const BENEFICIOS = [
  {
    icon:     Star,
    titulo:   'Precios por Mayoreo',
    desc:     'Tarifas escalonadas desde la primera pieza. Entre más compras, mejor precio por unidad.',
    color:    C.pink,
    gradient: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
  },
  {
    icon:     MessageCircle,
    titulo:   'Pedidos por WhatsApp',
    desc:     'Genera tu orden desde el catálogo y envíala directo al +52 452 104 0377. Sin llamadas.',
    color:    C.purple,
    gradient: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
  },
  {
    icon:     MapPin,
    titulo:   'Envíos a Todo México',
    desc:     'Envíos locales en Uruapan y nacionales a todo el país. También recolección en sucursal.',
    color:    C.cyan,
    gradient: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
  },
];

const CATEGORIAS = [
  { icon: CircleDot,     titulo: 'Globos de Látex',       desc: 'Glomex, Decoratex y Sempertex. Colores, tamaños y calidad helio', color: C.pink,   href: '/catalogo/globos/globos-latex'   },
  { icon: Shapes,        titulo: 'Globos de Personajes',  desc: 'Personajes de moda, graduación y Día de las Madres',              color: C.orange, href: '/catalogo/globos/globos-figuras' },
  { icon: PanelsTopLeft, titulo: 'Cortinas y Guirnaldas', desc: 'Cortinas de lluvia, guirnaldas y decoraciones para todo evento',  color: C.purple, href: '/catalogo/decoracion'             },
  { icon: Boxes,         titulo: 'Sets y Accesorios',     desc: 'Sets de 5 piezas, velas, brillo, bombas eléctricas y más',        color: C.green,  href: '/catalogo/inflado-y-helio'       },
];

const PASOS = [
  { num: '1', icon: ShoppingBag,   titulo: 'Navega',       desc: 'Explora +500 artículos: globos, cortinas, guirnaldas, velas y más.',  color: C.pink   },
  { num: '2', icon: Package,       titulo: 'Al carrito',   desc: 'Agrega productos y ve el precio mayoreo actualizado en tiempo real.',  color: C.purple },
  { num: '3', icon: Sparkles,      titulo: 'Revisa',       desc: 'Confirma cantidades, precios escalonados y elige entrega o envío.',    color: C.cyan   },
  { num: '4', icon: MessageCircle, titulo: 'Por WhatsApp', desc: 'Un toque y tu pedido llega listo al +52 452 104 0377. Sin llamadas.',  color: C.green  },
];

const MARCAS = [
  { nombre: 'Glomex',     code: 'GX', tag: 'Látex profesional', desc: 'Colores, gamas y medidas para decoración y mayoreo.', color: C.pink,   featured: true },
  { nombre: 'Decoratex',  code: 'DX', tag: 'Decoración y látex', desc: 'Opciones versátiles para montajes y celebraciones.', color: C.purple },
  { nombre: 'Sempertex',  code: 'SX', tag: 'Látex premium',      desc: 'Calidad profesional y color uniforme.',              color: C.green  },
  { nombre: 'El Bueno',   code: 'EB', tag: 'Fiesta y foil',      desc: 'Globos y artículos para completar cada evento.',     color: C.orange },
  { nombre: 'Mega Shine', code: 'MS', tag: 'Cuidado del globo',  desc: 'Brillo y accesorios para acabados impecables.',      color: C.cyan   },
  { nombre: 'Glow Shine', code: 'GS', tag: 'Acabado profesional', desc: 'Soluciones de brillo para decoraciones premium.',   color: C.blue   },
];

const RESENAS = [
  {
    id:      1,
    nombre:  'Ernesto Reyes',
    inicial: 'E',
    color:   C.pink,
    stars:   4,
    texto:   'Tiene la gran mayoría de lo que buscas. Claro, no siempre van a tener todo lo que quieres pero es una gran sucursal para surtir la gran mayoría para tus fiestas. Los empleados muy atentos y te ayudan a buscar lo que requieres.',
    fecha:   'hace 8 meses',
  },
  {
    id:      2,
    nombre:  'Bygoq Ponce',
    inicial: 'B',
    color:   C.purple,
    stars:   5,
    texto:   'Rápida atención y buen surtido en artículos de fiesta, precios muy bajos.',
    fecha:   'hace un año',
  },
  {
    id:      3,
    nombre:  'Jessi Garibay Gomez',
    inicial: 'J',
    color:   C.green,
    stars:   5,
    texto:   'Excelente servicio, siempre tienen lo que necesito y sobre todo a muy buen precio. 10/10.',
    fecha:   'hace 9 meses',
  },
  {
    id:      4,
    nombre:  'Yuri Avila',
    inicial: 'Y',
    color:   C.orange,
    stars:   5,
    texto:   'Excelente atención y precios muy accesibles. Me trataron muy bien.',
    fecha:   'hace 10 meses',
  },
  {
    id:      5,
    nombre:  'Lopez Mederos',
    inicial: 'L',
    color:   C.cyan,
    stars:   5,
    texto:   'Encuentras de todo y a un súper precio, muy recomendable.',
    fecha:   'hace 7 meses',
  },
  {
    id:      6,
    nombre:  'Yazmin Lopez',
    inicial: 'Y',
    color:   C.blue,
    stars:   5,
    texto:   'Todo a buen precio y excelente atención.',
    fecha:   'hace 10 meses',
  },
  {
    id:      7,
    nombre:  'Perla Rubi Heredia Alba',
    inicial: 'P',
    color:   C.pink,
    stars:   5,
    texto:   'Encuentra lo básico para casi cualquier tipo de fiesta, a precios bajos. En los últimos meses han aumentado su variedad en mercancía.',
    fecha:   'hace 11 meses',
  },
];

const SUCURSALES = [
  {
    nombre:    ENV.suc1.nombre,
    badge:     ENV.suc1.badge,
    direccion: ENV.suc1.direccion,
    horario:   'Lun–Sáb 9am–7pm',
    mapsUrl:   ENV.suc1.mapsUrl,
    embedUrl:  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.8065692929063!2d-102.0549798!3d19.420761799999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842de367f2d59469%3A0x4799181c21c26fd5!2sFull%20Party%20Uruapan%20Suc%20Francisco%20Villa!5e0!3m2!1ses-419!2smx!4v1776194961609!5m2!1ses-419!2smx',
    facebook:  ENV.suc1.facebook,
    color:     C.pink,
    accent:    C.orange,
    ilustId:   'suc1',
  },
  {
    nombre:    ENV.suc2.nombre,
    badge:     ENV.suc2.badge,
    direccion: ENV.suc2.direccion,
    horario:   'Lun–Sáb 9am–7pm · Dom 9am–2pm',
    mapsUrl:   ENV.suc2.mapsUrl,
    embedUrl:  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.1415130404407!2d-102.0274577!3d19.4062907!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842de3bcdec90e8d%3A0x5158156fe2efca48!2sFull%20Party%20Uruapan%20Suc%20Sol%20Naciente!5e0!3m2!1ses-419!2smx!4v1776194928231!5m2!1ses-419!2smx',
    facebook:  ENV.suc2.facebook,
    color:     C.purple,
    accent:    C.cyan,
    ilustId:   'suc2',
  },
];

const FAQS = [
  {
    pregunta:  '¿Tienen precios de mayoreo y menudeo?',
    respuesta: 'Sí, manejamos ambos. Los precios son escalonados: entre más piezas compras, mejor precio por unidad. Las tablas están visibles en cada producto del catálogo digital.',
  },
  {
    pregunta:  '¿Cómo hago un pedido?',
    respuesta: 'Navega el catálogo, agrega lo que necesitas al carrito y con un toque envías tu pedido listo a nuestro WhatsApp +52 452 104 0377. Sin llamadas, sin formularios.',
  },
  {
    pregunta:  '¿Hacen envíos a todo México?',
    respuesta: 'Sí, realizamos envíos locales en Uruapan y nacionales a todo México. También puedes recoger en nuestras sucursales: Suc. Francisco Villa (tel. 452 525 4596, Lun–Sáb 9am–7pm) o Suc. Sol Naciente (tel. 452 104 0377, Lun–Sáb 9am–7pm · Dom 9am–2pm).',
  },
  {
    pregunta:  '¿Dónde están ubicadas sus sucursales?',
    respuesta: 'Tenemos dos sucursales en Uruapan, Michoacán. Suc. Francisco Villa: C. Francisco Villa 103, Centro — Lun–Sáb 9am–7pm (cerrado domingos). Suc. Sol Naciente: Universo 117, Col. Sol Naciente — Lun–Sáb 9am–7pm y Dom 9am–2pm.',
  },
  {
    pregunta:  '¿Qué marcas de globos manejan?',
    respuesta: 'Distribuimos Glomex, Decoratex, Sempertex, El Bueno, Mega Shine y Glow Shine. Más de 500 productos en catálogo: globos de látex, foil, números, letras, personajes y accesorios.',
  },
  {
    pregunta:  '¿Atienden a decoradores y revendedores?',
    respuesta: 'Sí, atendemos a decoradores, revendedores, organizadores de eventos, escuelas y empresas con precios de mayoreo. Actualizamos el catálogo constantemente con personajes y productos de tendencia.',
  },
  {
    pregunta:  '¿Cuál es el pedido mínimo?',
    respuesta: 'No hay mínimo fijo. Los precios mayoreo aplican según la tabla escalonada de cada producto. Puedes combinar artículos de diferentes categorías en un solo pedido por WhatsApp.',
  },
];

/**
 * Galería de decoraciones de clientes.
 * Para agregar fotos reales: pon la URL en el campo `img`.
 * Ejemplo: img: 'https://tudominio.com/foto-cliente.jpg'
 * Cuando img es null se muestra un placeholder festivo.
 */
/**
 * ⚠️  Las URLs de Facebook CDN expiran (~7 días).
 *    Para uso permanente: descarga las fotos y súbelas a
 *    Supabase Storage o a la carpeta public/ del proyecto,
 *    luego reemplaza cada `img` con la URL definitiva.
 */
const GALERIA = [
  {
    id: 1,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/15%20anos.png',
    cliente: 'Sofía M.',   evento: 'XV Años',     emoji: '🎀', color: C.pink,   accent: C.purple,
  },
  {
    id: 2,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/cumpleanos.png',
    cliente: 'Lupita R.',  evento: 'Cumpleaños',  emoji: '🎂', color: C.orange, accent: C.yellow,
  },
  {
    id: 3,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/babyshower.png',
    cliente: 'Ana G.',     evento: 'Baby Shower', emoji: '🍼', color: C.cyan,   accent: C.blue,
  },
  {
    id: 4,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/boda.png',
    cliente: 'Karen V.',   evento: 'Boda',        emoji: '💍', color: C.purple, accent: C.pink,
  },
  {
    id: 5,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/graduacion.png',
    cliente: 'Fernanda L.', evento: 'Graduación', emoji: '🎓', color: C.green,  accent: C.cyan,
  },
  {
    id: 6,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/fiesta.png',
    cliente: 'Tú',         evento: '¡Tu fiesta!', emoji: '🎉', color: C.pink,   accent: C.orange,
  },
];

// Confeti decorativo — reducido a 10 elementos para mejor rendimiento
const PARTICLES = [
  { id:  0, top:  6, left:  8, size: 10, color: C.pink,   dur:  7, delay: 0.0, shape: 'square'  },
  { id:  1, top: 12, left: 87, size:  7, color: C.orange,  dur:  9, delay: 1.5, shape: 'circle'  },
  { id:  2, top: 20, left: 62, size:  9, color: C.cyan,    dur:  8, delay: 0.5, shape: 'diamond' },
  { id:  3, top:  3, left: 44, size:  6, color: C.purple,  dur: 10, delay: 2.0, shape: 'square'  },
  { id:  4, top: 36, left: 17, size: 12, color: C.green,   dur:  7, delay: 3.0, shape: 'circle'  },
  { id:  5, top: 56, left: 77, size:  8, color: C.pink,    dur: 11, delay: 1.0, shape: 'square'  },
  { id:  6, top: 70, left: 32, size:  7, color: C.orange,  dur:  8, delay: 4.0, shape: 'diamond' },
  { id:  7, top: 83, left: 91, size:  9, color: C.cyan,    dur:  9, delay: 2.5, shape: 'circle'  },
  { id:  8, top: 47, left:  3, size:  8, color: C.blue,    dur: 10, delay: 0.8, shape: 'square'  },
  { id:  9, top: 92, left: 54, size:  5, color: C.purple,  dur:  7, delay: 1.2, shape: 'circle'  },
];
// 7. COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadNovedades, setLoadNovedades] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (loadNovedades) return undefined;

    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      setLoadNovedades(true);
    };

    const timeoutId = window.setTimeout(load, 1800);
    const idleId = window.requestIdleCallback?.(load, { timeout: 1300 });

    window.addEventListener('scroll', load, { once: true, passive: true });
    window.addEventListener('pointerdown', load, { once: true, passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      window.removeEventListener('scroll', load);
      window.removeEventListener('pointerdown', load);
    };
  }, [loadNovedades]);

  const handleNav = useCallback((link) => {
    setMenuOpen(false);
    if (link.hash) {
      navigate(link.href);
    } else {
      document.getElementById(link.href)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [navigate]);

  const irAlCatalogo = useCallback(() => {
    trackEvent('cta_catalogo_click');
    navigate('/catalogo');
  }, [navigate]);

  const buscarEnCatalogo = useCallback((event) => {
    event.preventDefault();
    const query = catalogSearch.trim();
    trackEvent('landing_catalog_search', { has_query: Boolean(query) });
    navigate(query ? `/catalogo?q=${encodeURIComponent(query)}` : '/catalogo');
  }, [catalogSearch, navigate]);

  return (
    <div id="top" className="lp-page-shell relative min-h-screen font-body overflow-x-hidden">

      {/* ── Saltar al contenido principal ───────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-white focus:no-underline"
        style={{ '--tw-bg-opacity': 1, background: C.pink }}
      >
        Saltar al contenido principal
      </a>

      {/* ── Confetti — solo en sm+ para no penalizar móvil ── */}
      <div className="hidden sm:block fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            style={{
              position:    'absolute',
              top:         `${p.top}%`,
              left:        `${p.left}%`,
              width:        p.size,
              height:       p.size,
              background:   p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              transform:    p.shape === 'diamond' ? 'rotate(45deg)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="relative" style={{ zIndex: 2 }}>

        {/* ══ NAV ════════════════════════════════════════ */}
        <nav
          className="lp-main-nav sticky top-0 z-50"
          aria-label="Navegación principal"
        >
          <div className="lp-main-nav-inner max-w-6xl mx-auto px-5 flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <img
                src="/icons/icon-192.png"
                alt={`${ENV.negocio} logo`}
                width="44"
                height="44"
                className="w-11 h-11 rounded-xl flex-shrink-0"
                style={{ boxShadow: `0 4px 12px ${C.pink}44` }}
              />
              <div className="lp-main-nav-brand min-w-0 leading-none">
                <span
                  className="lp-main-nav-title font-display text-2xl block"
                  style={{
                    background:            `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor:  'transparent',
                    backgroundClip:       'text',
                  }}
                >
                  <span className="lp-brand-full">Full</span>
                  <span className="lp-brand-party">Party</span>
                </span>
                <span className="lp-main-nav-subtitle text-[10px] font-black tracking-widest uppercase">
                  Mayoreo · Uruapan
                </span>
              </div>
            </Link>

            {/* Links desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map(l => (
                <button
                  key={l.label}
                  onClick={() => handleNav(l)}
                  className="lp-nav-link px-3 py-2 whitespace-nowrap text-xs"
                  style={{ color: C.textBody }}
                >
                  {l.label}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                as="a"
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                iconLeft={<WaIcon size={13} />}
                className="lp-nav-whatsapp ml-2 whitespace-nowrap"
                onClick={() => trackEvent('nav_whatsapp_click')}
              >
                WhatsApp
              </Button>
            </div>

            {/* Hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl flex-shrink-0"
              style={{ background: C.surfaceLavender, color: C.purple }}
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
                  style={{ color: C.textBody }}
                >
                  {l.label}
                </button>
              ))}
              <Button
                variant="primary"
                size="md"
                as="a"
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                iconLeft={<WaIcon size={14} />}
                fullWidth
                className="mt-1"
                onClick={() => { setMenuOpen(false); trackEvent('nav_whatsapp_click'); }}
              >
                Contactar por WhatsApp
              </Button>
            </div>
          )}
        </nav>

        {/* ══ CONTENIDO PRINCIPAL ════════════════════════ */}
        <main id="main-content">

        {/* ══ HERO ═══════════════════════════════════════ */}
        <section
          className="lp-hero relative px-5 pt-16 pb-12 text-center overflow-visible"
          aria-labelledby="hero-heading"
        >
          {/* Globos decorativos */}
          <div className="hidden sm:block absolute left-[7%] top-16 balloon-sway pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.pink} size={62} rotate={-8} /></div>
          <div className="hidden sm:block absolute left-[12%] bottom-24 balloon-sway-r pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.yellow} size={48} rotate={5} /></div>
          <div className="hidden sm:block absolute right-[8%] top-10 balloon-sway-r pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.cyan} size={76} rotate={10} /></div>
          <div className="hidden sm:block absolute right-[11%] bottom-24 balloon-sway pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.green} size={54} rotate={-5} /></div>

          <div className="relative max-w-4xl mx-auto" style={{ zIndex: 1 }}>
            <h1 id="hero-heading" className="sr-only">
              Full Party Uruapan - mayoreo y menudeo de artículos para fiesta
            </h1>
            <span
              className="lp-hero-kicker inline-flex items-center gap-2 text-xs font-black px-5 py-2 rounded-full mb-6"
              style={{ color: C.textMuted }}
            >
              <Sparkles size={12} aria-hidden="true" style={{ color: C.pink }} />
              +500 PRODUCTOS · MAYOREO Y MENUDEO
            </span>

            <div className="relative mb-6">
              <div className="lp-hero-aura" aria-hidden="true" />
              <BranchTyper branchNames={[ENV.suc1.nombre, ENV.suc2.nombre]} />
            </div>

            <p className="lp-hero-copy text-base sm:text-lg leading-relaxed mb-7 max-w-2xl mx-auto" style={{ color: C.textBody }}>
              Todo para tu celebración, por pieza o mayoreo. Encuentra globos por color,
              medida o gama y envía tu pedido listo por WhatsApp.
            </p>

            <form className="lp-hero-search" role="search" onSubmit={buscarEnCatalogo}>
              <Search size={19} aria-hidden="true" />
              <label htmlFor="landing-catalog-search" className="sr-only">Buscar en el catálogo</label>
              <input
                id="landing-catalog-search"
                type="search"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Busca globos, colores, medidas o decoración"
                autoComplete="off"
              />
              <button type="submit" aria-label="Buscar en el catálogo">
                <span>Buscar</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            <div className="lp-hero-actions w-full max-w-[340px] mx-auto sm:max-w-none flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                pulse
                fullWidth
                onClick={irAlCatalogo}
                iconRight={<ArrowRight size={16} aria-hidden="true" />}
                className="lp-hero-primary max-w-full sm:w-auto"
              >
                Explorar productos
              </Button>
              <Button
                variant="outline"
                size="lg"
                as="a"
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                iconLeft={<WaIcon size={18} />}
                fullWidth
                className="lp-hero-whatsapp max-w-full sm:w-auto whitespace-nowrap"
                onClick={() => trackEvent('hero_whatsapp_click')}
              >
                Cotizar por WhatsApp
              </Button>
            </div>

            <div className="lp-hero-proof mt-7 mx-auto text-xs sm:text-sm" style={{ color: C.textBody }} aria-label="Ventajas de comprar en Full Party">
              {[
                { icon: Star,       label: '4.7 en Google',        color: C.orange },
                { icon: BadgeCheck, label: 'Compra desde 1 pieza', color: C.green  },
                { icon: Truck,      label: 'Envíos a todo México', color: C.cyan   },
                { icon: MapPin,     label: '2 sucursales',         color: C.pink   },
              ].map(({ icon: Icon, label, color }) => (
                <span key={label} className="lp-proof-item">
                  <span className="lp-proof-icon" style={{ background: `${color}1a`, color }} aria-hidden="true">
                    <Icon size={12} strokeWidth={2.75} />
                  </span>
                  {label}
                </span>
              ))}
            </div>

            {/* Stats */}
            <Reveal delay={0.35}>
              <div className="hidden mt-14 flex-wrap justify-center gap-10">
                {[
                  { value: '500+', label: 'Productos',  color: C.pink   },
                  { value: '12+',  label: 'Categorías', color: C.purple },
                  { value: '2',    label: 'Sucursales', color: C.cyan   },
                  { value: '💜',   label: 'Uruapan',    color: C.orange },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="font-display text-3xl" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs font-bold uppercase tracking-wide mt-0.5" style={{ color: C.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <CatalogQuickLinks />

        {/* ══ NOVEDADES ═══════════════════════════════════ */}
        <Suspense fallback={<NovedadesPlaceholder />}>
          {loadNovedades ? (
            <NovedadesSection />
          ) : (
            <NovedadesPlaceholder />
          )}
        </Suspense>
        {/* ══ BENEFICIOS ══════════════════════════════════ */}
        <section className="lp-below-fold lp-section-white lp-benefits-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle eyebrow="Ventajas" title="¿Por qué Full Party?" subtitle="Todo lo que necesitas para hacer tu fiesta un éxito." /></Reveal>
            <div className="lp-benefit-grid grid grid-cols-1 sm:grid-cols-3 gap-5">
              {BENEFICIOS.map(({ icon: Icon, titulo, desc, color, gradient }, i) => (
                <Reveal key={titulo} delay={i * 0.1}>
                  <GradCard gradient={gradient} hoverColor={`${color}22`} className="lp-benefit-card h-full">
                    <div className="p-6 flex flex-col gap-4">
                      <div
                        className="lp-benefit-icon w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: gradient, boxShadow: `0 8px 20px ${color}40` }}
                      >
                        <Icon size={22} style={{ color: '#ffffff' }} aria-hidden="true" />
                      </div>
                      <h3 className="font-display text-base" style={{ color: C.textHead }}>{titulo}</h3>
                      <p className="text-sm leading-relaxed"  style={{ color: C.textBody }}>{desc}</p>
                    </div>
                  </GradCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CATEGORÍAS ══════════════════════════════════ */}
        <section className="lp-below-fold lp-section-tint lp-categories-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle eyebrow="Explora" title="Categorías Destacadas" subtitle="Los artículos más solicitados para tus eventos." /></Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIAS.map(({ icon: Icon, titulo, desc, color, href }, i) => (
                <Reveal key={titulo} delay={i * 0.08}>
                  <Link
                    to={href}
                    className="lp-cat-card w-full rounded-2xl p-5 text-center flex flex-col items-center gap-3"
                    style={{
                      '--cat-accent':       color,
                      '--cat-border-hover': `${color}66`,
                      '--cat-shadow-hover': `0 8px 28px ${color}22`,
                    }}
                  >
                    <span className="lp-cat-icon" aria-hidden="true">
                      <Icon size={25} strokeWidth={1.8} />
                    </span>
                    <h3 className="font-display text-sm leading-snug" style={{ color: C.textHead }}>{titulo}</h3>
                    <p  className="text-xs leading-snug"              style={{ color: C.textMuted }}>{desc}</p>
                    <span className="text-xs font-black flex items-center gap-1" style={{ color }}>Ver más <ArrowRight size={11} aria-hidden="true" /></span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CÓMO FUNCIONA ═══════════════════════════════ */}
        <section className="lp-below-fold lp-section-white lp-steps-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle eyebrow="Paso a paso" title="¿Cómo funciona?" subtitle="Pedir al mayoreo nunca había sido tan fácil." /></Reveal>

            {/* Desktop */}
            <div className="lp-steps-panel hidden md:grid grid-cols-4 gap-0 relative">
              <div
                className="absolute top-[38px] left-[13%] right-[13%] h-[2px] rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.cyan}, ${C.green})` }}
                aria-hidden="true"
              />
              {PASOS.map(({ num, icon: Icon, titulo, desc, color }, i) => (
                <Reveal key={num} delay={i * 0.12}>
                  <div className="lp-step flex flex-col items-center text-center px-4">
                    <div
                      className="relative z-10 w-[76px] h-[76px] rounded-full flex items-center justify-center mb-5 bg-white"
                      style={{ border: `3px solid ${color}`, boxShadow: `0 4px 20px ${color}44` }}
                    >
                      <Icon size={28} style={{ color }} aria-hidden="true" />
                      <span
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-display text-white"
                        style={{ background: color, boxShadow: `0 2px 8px ${color}88` }}
                        aria-hidden="true"
                      >{num}</span>
                    </div>
                    <h3 className="font-display text-sm mb-1.5" style={{ color: C.textHead }}>{titulo}</h3>
                    <p  className="text-xs leading-relaxed"    style={{ color: C.textBody }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Mobile */}
            <div className="lp-steps-mobile md:hidden flex flex-col gap-0 relative">
              <div
                className="absolute left-[19px] top-5 bottom-5 w-[2px] rounded-full"
                style={{ background: `linear-gradient(180deg, ${C.pink}, ${C.purple}, ${C.cyan}, ${C.green})` }}
                aria-hidden="true"
              />
              {PASOS.map(({ num, icon: Icon, titulo, desc, color }, i) => (
                <Reveal key={num} delay={i * 0.1} direction="left">
                  <div className={`lp-step-mobile grid grid-cols-[40px_minmax(0,1fr)] gap-4 items-start relative ${i === PASOS.length - 1 ? 'pb-0' : 'pb-9'}`}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center z-10 bg-white"
                      style={{ border: `2px solid ${color}`, boxShadow: `0 0 12px ${color}44` }}
                      aria-hidden="true"
                    >
                      <span className="font-display text-sm" style={{ color }}>{num}</span>
                    </div>
                    <div className="pt-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={15} style={{ color }} aria-hidden="true" />
                        <h3 className="font-display text-sm" style={{ color: C.textHead }}>{titulo}</h3>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: C.textBody }}>{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MARCAS ══════════════════════════════════════ */}
        <section className="lp-below-fold lp-section-tint lp-brands-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle eyebrow="Marcas especializadas" title="Una marca para cada acabado" subtitle="Seleccionamos opciones confiables para decoración profesional, mayoreo y celebraciones." /></Reveal>
            <div className="lp-brand-showcase">
              {MARCAS.map((m, i) => (
                <Reveal key={m.nombre} delay={i * 0.07} className={m.featured ? 'lp-brand-cell--featured' : 'lp-brand-cell'}>
                  <BrandCard {...m} index={i} />
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2}>
              <div className="lp-brand-proof">
                <div className="lp-brand-proof-copy">
                  <BadgeCheck size={24} aria-hidden="true" />
                  <div>
                    <span>Respaldo Full Party</span>
                    <strong>Compra con confianza</strong>
                  </div>
                </div>
                <div className="lp-brand-proof-items">
                  {[
                    { label: 'Distribución autorizada', color: C.pink   },
                    { label: 'Producto original',       color: C.purple },
                    { label: 'Opciones de mayoreo',     color: C.green  },
                  ].map(({ label, color }) => (
                    <span key={label} style={{ '--proof-accent': color }}>
                      <i aria-hidden="true">✓</i> {label}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ RESEÑAS ═════════════════════════════════════ */}
        <section id="resenas" className="lp-below-fold lp-section-white lp-reviews-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <SectionTitle
                eyebrow="Testimonios"
                title="Lo que dicen nuestros clientes"
                subtitle="Reseñas verificadas de clientes satisfechos en Google Maps."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <ReviewsCarousel resenas={RESENAS} />
            </Reveal>
          </div>
        </section>

        {/* ══ GALERÍA DE CLIENTES ═════════════════════════ */}
        <section className="lp-below-fold lp-section-tint lp-gallery-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <SectionTitle
                eyebrow="Inspiración"
                title="Así celebran nuestros clientes"
                subtitle="Decoraciones reales creadas con productos Full Party Uruapan."
              />
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {GALERIA.map((item, i) => (
                <Reveal key={item.id} delay={i * 0.07}>
                  <GaleriaCard
                    {...item}
                    floatDur={4.5 + (i % 3) * 0.6}
                    floatDelay={i * 0.5}
                  />
                </Reveal>
              ))}
            </div>

            {/* CTA para que clientes compartan sus fotos */}
            <Reveal delay={0.2}>
              <div
                className="lp-gallery-share rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div>
                  <p className="font-display text-sm" style={{ color: C.textHead }}>
                    ¿Decoraste con productos Full Party?
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                    Comparte tu foto por WhatsApp y aparece aquí 🎉
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  as="a"
                  href={`https://wa.me/${ENV.waNumber}?text=${encodeURIComponent('¡Hola! Quiero compartir la foto de mi decoración con productos Full Party 🎉')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  iconLeft={<WaIcon size={14} />}
                  onClick={() => trackEvent('galeria_compartir_click')}
                >
                  Compartir mi foto
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════ */}
        <section id="faq" className="lp-below-fold lp-section-white lp-faq-section px-5 py-16">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <SectionTitle
                eyebrow="Ayuda"
                title="Preguntas Frecuentes"
                subtitle="Todo lo que necesitas saber antes de hacer tu primer pedido."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <div
                className="lp-faq-panel rounded-3xl p-2"
              >
                {FAQS.map((faq, i) => (
                  <FaqItem key={i} {...faq} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ SUCURSALES ══════════════════════════════════ */}
        <section id="sucursales" className="lp-below-fold lp-section-tint lp-branches-section px-5 py-16">
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle eyebrow="Visítanos" title="Nuestras Sucursales" subtitle="Visítanos en Uruapan, Michoacán." /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SUCURSALES.map(({ nombre, direccion, horario, mapsUrl, embedUrl, badge, color, accent, facebook }, i) => (
                <Reveal key={nombre} delay={i * 0.1} direction={i === 0 ? 'left' : 'right'}>
                  <GradCard
                    gradient={`linear-gradient(135deg, ${color}, ${accent})`}
                    hoverColor={`${color}22`}
                    className="lp-branch-card h-full"
                  >
                    <div>
                      {/* Encabezado con mapa embebido */}
                      <div
                        className="lp-branch-map h-40 relative overflow-hidden rounded-t-[14px]"
                        style={{ borderBottom: `1px solid ${color}33` }}
                      >
                        <LazyMapIframe
                          src={embedUrl}
                          title={`Mapa de ${ENV.negocio} ${nombre}`}
                        />
                        <span
                          className="absolute top-3 left-3 text-xs font-black px-3 py-1 rounded-full z-10"
                          style={{
                            background:    'rgba(255,255,255,0.9)',
                            color,
                            border:        `1px solid ${color}44`,
                            backdropFilter:'blur(6px)',
                          }}
                        >{badge}</span>
                      </div>
                      <div className="lp-branch-content p-5 flex flex-col gap-3">
                        <h3 className="font-display text-base" style={{ color: C.textHead }}>{ENV.negocio} {nombre}</h3>
                        <p className="flex items-start gap-2 text-sm" style={{ color: C.textBody }}>
                          <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />{direccion}
                        </p>
                        <p className="flex items-center gap-2 text-sm" style={{ color: C.textBody }}>
                          <Clock size={13} style={{ color }} aria-hidden="true" />{horario}
                        </p>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-branch-action mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}33` }}
                          onClick={() => trackEvent('maps_link_click', { sucursal: nombre })}
                        >
                          <Navigation size={13} aria-hidden="true" /> Ver en Google Maps
                        </a>

                        {/* Redes sociales de la sucursal */}
                        {facebook && (
                          <Button
                            variant="facebook"
                            size="sm"
                            as="a"
                            href={facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            iconLeft={<FbIcon size={14} />}
                            fullWidth
                            className="mt-2"
                            style={{ background: '#1877F214', color: '#1877F2', border: '1px solid #1877F233' }}
                            onClick={() => trackEvent('facebook_click', { sucursal: nombre })}
                          >
                            Facebook
                          </Button>
                        )}
                      </div>
                    </div>
                  </GradCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ═══════════════════════════════════ */}
        <section id="contacto" className="lp-below-fold lp-section-white px-5 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <div className="lp-cta-panel rounded-[2rem] px-8 py-14 sm:py-16">
                <div className="relative" style={{ zIndex: 1 }}>
                  <div className="lp-cta-mark" aria-hidden="true">
                    <PartyPopper size={27} strokeWidth={1.8} />
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl mb-4 text-white">¿Listo para ordenar al mayoreo?</h2>
                  <p className="text-sm sm:text-base leading-relaxed mb-10 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    Escríbenos por WhatsApp o explora el catálogo. Atención personalizada para distribuidores y organizadores de eventos.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={irAlCatalogo}
                      iconLeft={<ShoppingBag size={18} aria-hidden="true" />}
                      className="lp-cta-btn-white"
                    >
                      Explorar Catálogo
                    </Button>
                    <Button
                      variant="whatsapp"
                      size="lg"
                      as="a"
                      href={WA_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      iconLeft={<WaIcon size={18} />}
                      className="lp-cta-btn-outline"
                      onClick={() => trackEvent('cta_whatsapp_click')}
                    >
                      Contactar por WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        </main>

        {/* ══ FOOTER — 3 columnas ══════════════════════════ */}
        <footer className="lp-footer lp-below-fold">
          <div className="max-w-5xl mx-auto px-5 pt-10 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Columna 1: Logo + tagline + WhatsApp */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/icons/icon-48.png" alt={ENV.negocio} width="32" height="32" className="w-8 h-8 rounded-lg" />
                <span
                  className="font-display text-base"
                  style={{
                    background:            `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
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
              {/* Botones de redes sociales */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="whatsapp"
                  size="sm"
                  as="a"
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  iconLeft={<WaIcon size={12} />}
                  onClick={() => trackEvent('footer_whatsapp_click')}
                  aria-label="WhatsApp"
                >
                  WhatsApp
                </Button>
                {ENV.suc1.facebook && (
                  <Button
                    variant="facebook"
                    size="sm"
                    as="a"
                    href={ENV.suc1.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    iconLeft={<FbIcon size={12} />}
                    onClick={() => trackEvent('footer_facebook_suc1_click')}
                    aria-label={`Facebook Suc. ${ENV.suc1.nombre}`}
                  >
                    Suc. {ENV.suc1.nombre}
                  </Button>
                )}
                {ENV.suc2.facebook && (
                  <Button
                    variant="facebook"
                    size="sm"
                    as="a"
                    href={ENV.suc2.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    iconLeft={<FbIcon size={12} />}
                    onClick={() => trackEvent('footer_facebook_suc2_click')}
                    aria-label={`Facebook Suc. ${ENV.suc2.nombre}`}
                  >
                    Suc. {ENV.suc2.nombre}
                  </Button>
                )}
                {ENV.tiktok && (
                  <Button
                    variant="tiktok"
                    size="sm"
                    as="a"
                    href={ENV.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    iconLeft={<TikTokIcon size={12} />}
                    onClick={() => trackEvent('footer_tiktok_click')}
                    aria-label="TikTok"
                  >
                    TikTok
                  </Button>
                )}
              </div>
            </div>

            {/* Columna 2: Navegación */}
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

            {/* Columna 3: Secciones */}
            <div>
              <h3 className="lp-footer-heading font-display text-sm mb-4">Secciones</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    to="/catalogo"
                    className="lp-footer-link text-xs font-bold"
                  >
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link
                    to="/destacados"
                    className="lp-footer-link text-xs font-bold"
                  >
                    Categorías destacadas
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sucursales"
                    className="lp-footer-link text-xs font-bold"
                  >
                    Sucursales
                  </Link>
                </li>
                <li>
                  <Link
                    to="/como-funciona"
                    className="lp-footer-link text-xs font-bold"
                  >
                    ¿Cómo hacer un pedido?
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="lp-footer-link text-xs font-bold"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div>
              <h3 className="lp-footer-heading font-display text-sm mb-4">Contacto</h3>
              <ul className="lp-footer-text flex flex-col gap-3 text-xs">
                <li className="flex items-start gap-2">
                  <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: C.pink }} aria-hidden="true" />
                  <span>
                    <span className="font-bold" style={{ color: '#ede7fb' }}>Suc. Francisco Villa</span><br />
                    C. Francisco Villa 103, Centro<br />
                    <Clock size={10} className="inline mr-0.5" aria-hidden="true" />Lun–Sáb 9am–7pm
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: C.purple }} aria-hidden="true" />
                  <span>
                    <span className="font-bold" style={{ color: '#ede7fb' }}>Suc. Sol Naciente</span><br />
                    Universo 117, Sol Naciente<br />
                    <Clock size={10} className="inline mr-0.5" aria-hidden="true" />Lun–Sáb 9am–7pm · Dom 9am–2pm
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle size={12} style={{ color: C.pink }} aria-hidden="true" />
                  <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="lp-footer-link font-bold">
                    WhatsApp: 452 104 0377
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Barra inferior */}
          <div
            className="lp-footer-bottom px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          >
            <span>© {new Date().getFullYear()} {ENV.negocio} · Uruapan, Michoacán · Todos los derechos reservados</span>
            <div className="flex gap-4">
              <button
                onClick={irAlCatalogo}
                className="lp-footer-link font-bold"
              >
                Catálogo
              </button>
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="lp-footer-link font-bold"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* ══ BOTÓN FLOTANTE WHATSAPP ══════════════════════ */}
      <aside aria-label="Contacto rápido">
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-pulse fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full font-black text-sm text-white lp-scale-hover w-14 h-14 p-0 sm:w-auto sm:h-auto sm:gap-2.5 sm:pl-4 sm:pr-5 sm:py-3.5"
          style={{ background: 'linear-gradient(135deg, #25d366, #1aab56)', boxShadow: '0 6px 20px rgba(37,211,102,0.5)' }}
          aria-label="¿Dudas? ¡Escríbenos!"
          onClick={() => trackEvent('fab_whatsapp_click')}
        >
          <WaIcon size={20} />
          <span className="hidden sm:inline">¿Dudas? ¡Escríbenos!</span>
        </a>
      </aside>
    </div>
  );
}
