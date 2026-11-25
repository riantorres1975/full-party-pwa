import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, MapPin, Star, Package,
  Sparkles, ArrowRight, Navigation, Clock,
  BadgeCheck, Truck, Search, PartyPopper,
} from 'lucide-react';
import './LandingPage.css';
import { C } from '../styles/tokens';
import Reveal from '../components/landing/Reveal';
import GradCard from '../components/landing/GradCard';
import { WaIcon, FbIcon, TikTokIcon } from '../components/icons/SocialIcons';
import SectionTitle from '../components/landing/SectionTitle';
import FaqItem from '../components/landing/FaqItem';
import Button from '../components/ui/Button';
import ReviewsCarousel from '../components/landing/ReviewsCarousel';
import GaleriaCard from '../components/landing/GaleriaCard';
import BrandCard from '../components/landing/BrandCard';
import CatalogQuickLinks from '../components/landing/CatalogQuickLinks';
import NovedadesPlaceholder from '../components/landing/NovedadesPlaceholder';
import PublicSiteHeader from '../components/PublicSiteHeader';
import { trackEvent } from '../utils/analytics';
import { SUCURSALES as DATOS_SUCURSALES } from '../data/sucursales';
import { buildContactWhatsAppUrl } from '../data/siteContact';

const NovedadesSection = lazy(() => import('../components/landing/NovedadesSection'));

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
const NOMBRE_NEGOCIO = import.meta.env.VITE_NOMBRE_NEGOCIO || 'Full Party';
const TIKTOK_URL = import.meta.env.VITE_TIKTOK_URL;
const WA_HREF = buildContactWhatsAppUrl('Hola, vi su página web y quiero ayuda para cotizar un pedido 🎉');

const NAV_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Destacados', href: '/destacados' },
  { label: 'Cómo comprar', href: '/como-funciona' },
  { label: 'Sucursales', href: '/sucursales' },
  { label: 'Blog', href: '/blog' },
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
    desc:     'Arma tu pedido desde el catálogo y envíalo por WhatsApp para confirmar los detalles.',
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

const PASOS = [
  { num: '1', icon: ShoppingBag,   titulo: 'Navega',       desc: 'Explora +500 artículos: globos, cortinas, guirnaldas, velas y más.',  color: C.pink   },
  { num: '2', icon: Package,       titulo: 'Al carrito',   desc: 'Agrega productos y ve el precio mayoreo actualizado en tiempo real.',  color: C.purple },
  { num: '3', icon: Sparkles,      titulo: 'Revisa',       desc: 'Confirma cantidades, precios escalonados y elige entrega o envío.',    color: C.cyan   },
  { num: '4', icon: MessageCircle, titulo: 'Por WhatsApp', desc: 'Envía tu pedido por WhatsApp desde el carrito.',  color: C.green  },
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

const [franciscoVilla, solNaciente] = DATOS_SUCURSALES;
const SUCURSALES = [
  {
    ...franciscoVilla,
    nombre: import.meta.env.VITE_SUC1_NOMBRE || 'Francisco Villa',
    badge: import.meta.env.VITE_SUC1_BADGE || franciscoVilla.badge,
    direccion: import.meta.env.VITE_SUC1_DIRECCION || franciscoVilla.direccion,
    mapsUrl: import.meta.env.VITE_SUC1_MAPS_URL || franciscoVilla.mapsUrl,
    facebook: import.meta.env.VITE_SUC1_FACEBOOK,
  },
  {
    ...solNaciente,
    nombre: import.meta.env.VITE_SUC2_NOMBRE || 'Sol Naciente',
    badge: import.meta.env.VITE_SUC2_BADGE || solNaciente.badge,
    direccion: import.meta.env.VITE_SUC2_DIRECCION || solNaciente.direccion,
    mapsUrl: import.meta.env.VITE_SUC2_MAPS_URL || solNaciente.mapsUrl,
    facebook: import.meta.env.VITE_SUC2_FACEBOOK,
  },
];

const FAQS = [
  {
    pregunta:  '¿Tienen precios de mayoreo y menudeo?',
    respuesta: 'Sí, manejamos ambos. Los precios son escalonados: entre más piezas compras, mejor precio por unidad. Las tablas están visibles en cada producto del catálogo digital.',
  },
  {
    pregunta:  '¿Cómo hago un pedido?',
    respuesta: 'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.',
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

export default function LandingPage() {
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

  const trackCatalogClick = () => trackEvent('cta_catalogo_click');

  const buscarEnCatalogo = useCallback((event) => {
    event.preventDefault();
    const query = catalogSearch.trim();
    trackEvent('landing_catalog_search', { has_query: Boolean(query) });
    navigate(query ? `/catalogo?q=${encodeURIComponent(query)}` : '/catalogo');
  }, [catalogSearch, navigate]);

  return (
    <div id="top" className="lp-page-shell min-h-screen font-body">

      {/* ── Saltar al contenido principal ───────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-white focus:bg-[#44216a]"
      >
        Saltar al contenido principal
      </a>

      <PublicSiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="lp-hero px-5" aria-labelledby="hero-heading">
          <div className="lp-hero-inner max-w-[1152px] mx-auto">
            <div className="lp-hero-content">
              <p className="lp-hero-kicker">
                <Sparkles size={16} aria-hidden="true" />
                Artículos para fiesta en Uruapan
              </p>

              <h1 id="hero-heading" className="font-display">
                Todo para tu <span>próxima fiesta.</span>
              </h1>
              <p className="lp-hero-copy">
                Globos, decoración y artículos para celebrar. Compra por pieza o al mayoreo y envía tu pedido por WhatsApp.
              </p>

              <form className="lp-hero-search" role="search" onSubmit={buscarEnCatalogo}>
                <Search size={19} aria-hidden="true" />
                <label htmlFor="landing-catalog-search" className="sr-only">Buscar productos</label>
                <input
                  id="landing-catalog-search"
                  type="search"
                  name="q"
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Ej. globos"
                  autoComplete="off"
                />
                <button type="submit">Buscar</button>
              </form>

              <div className="lp-hero-actions">
                <Button
                  as={Link}
                  to="/catalogo"
                  size="lg"
                  onClick={trackCatalogClick}
                  iconLeft={<ShoppingBag size={18} aria-hidden="true" />}
                  className="lp-hero-primary"
                >
                  Ver catálogo
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  as="a"
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  iconLeft={<WaIcon size={18} />}
                  className="lp-hero-whatsapp"
                  onClick={() => trackEvent('hero_whatsapp_click')}
                >
                  Cotizar por WhatsApp
                </Button>
              </div>
            </div>

            <picture className="lp-hero-media" aria-hidden="true">
              <img
                src="/landing-globos.webp"
                srcSet="/landing-globos-640.webp 640w, /landing-globos.webp 1280w"
                sizes="(min-width: 1180px) 546px, (min-width: 880px) 46vw, calc(100vw - 72px)"
                width="1280"
                height="960"
                fetchPriority="high"
                alt=""
              />
            </picture>
          </div>

          <ul className="lp-hero-proof max-w-[1152px] mx-auto" aria-label="Ventajas de comprar en Full Party">
            <li><BadgeCheck size={19} aria-hidden="true" /> Compra desde 1 pieza</li>
            <li><Truck size={19} aria-hidden="true" /> Envíos a todo México</li>
            <li>
              <a href="#sucursales">
                <MapPin size={19} aria-hidden="true" /> 2 sucursales en Uruapan
              </a>
            </li>
          </ul>
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
                  href={buildContactWhatsAppUrl('¡Hola! Quiero compartir la foto de mi decoración con productos Full Party 🎉')}
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
              {SUCURSALES.map(({ id, nombre, direccion, horario, horarioExtra, mapsUrl, embedUrl, badge, color, accent, textColor, facebook }, i) => (
                <Reveal key={id} delay={i * 0.1}>
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
                          title={`Mapa de ${NOMBRE_NEGOCIO} ${nombre}`}
                        />
                        <span
                          className="absolute top-3 left-3 text-xs font-black px-3 py-1 rounded-full z-10"
                          style={{
                            background:    'rgba(255,255,255,0.9)',
                            color:         textColor,
                            border:        `1px solid ${color}44`,
                            backdropFilter:'blur(6px)',
                          }}
                        >{badge}</span>
                      </div>
                      <div className="lp-branch-content p-5 flex flex-col gap-3">
                        <h3 className="font-display text-base" style={{ color: C.textHead }}>{NOMBRE_NEGOCIO} {nombre}</h3>
                        <p className="flex items-start gap-2 text-sm" style={{ color: C.textBody }}>
                          <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />{direccion}
                        </p>
                        <p className="flex items-start gap-2 text-sm" style={{ color: C.textBody }}>
                          <Clock size={13} className="mt-1 flex-shrink-0" style={{ color: textColor }} aria-hidden="true" />
                          <span>{horario}<br />{horarioExtra}</span>
                        </p>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-branch-action mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black"
                          style={{ background: `${color}12`, color: textColor, border: `1px solid ${color}33` }}
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
                      as={Link}
                      to="/catalogo"
                      onClick={trackCatalogClick}
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
                <img src="/icons/icon-48.png" alt={NOMBRE_NEGOCIO} width="32" height="32" className="w-8 h-8 rounded-lg" />
                <span
                  className="font-display text-base"
                  style={{
                    background:            `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor:  'transparent',
                    backgroundClip:       'text',
                  }}
                >
                  {NOMBRE_NEGOCIO}
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
                {SUCURSALES[0].facebook && (
                  <Button
                    variant="facebook"
                    size="sm"
                    as="a"
                    href={SUCURSALES[0].facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    iconLeft={<FbIcon size={12} />}
                    onClick={() => trackEvent('footer_facebook_suc1_click')}
                    aria-label={`Facebook Suc. ${SUCURSALES[0].nombre}`}
                  >
                    Suc. {SUCURSALES[0].nombre}
                  </Button>
                )}
                {SUCURSALES[1].facebook && (
                  <Button
                    variant="facebook"
                    size="sm"
                    as="a"
                    href={SUCURSALES[1].facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    iconLeft={<FbIcon size={12} />}
                    onClick={() => trackEvent('footer_facebook_suc2_click')}
                    aria-label={`Facebook Suc. ${SUCURSALES[1].nombre}`}
                  >
                    Suc. {SUCURSALES[1].nombre}
                  </Button>
                )}
                {TIKTOK_URL && (
                  <Button
                    variant="tiktok"
                    size="sm"
                    as="a"
                    href={TIKTOK_URL}
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
                    <Link to={l.href} className="lp-footer-link text-sm font-bold">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="lp-footer-heading font-display text-sm mb-4">En esta página</h3>
              <ul className="flex flex-col gap-2">
                <li><a href="#resenas" className="lp-footer-link text-sm font-bold">Reseñas</a></li>
                <li><a href="#sucursales" className="lp-footer-link text-sm font-bold">Direcciones y horarios</a></li>
                <li><a href="#faq" className="lp-footer-link text-sm font-bold">Preguntas frecuentes</a></li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div>
              <h3 className="lp-footer-heading font-display text-sm mb-4">Contacto</h3>
              <ul className="lp-footer-text flex flex-col gap-3 text-xs">
                {SUCURSALES.map(({ id, nombre, direccion, horario, color }) => (
                  <li className="flex items-start gap-2" key={id}>
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
                    <span>
                      <span className="font-bold text-white">{nombre}</span><br />
                      {direccion}<br />
                      {horario}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <MessageCircle size={12} style={{ color: C.pink }} aria-hidden="true" />
                  <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="lp-footer-link font-bold">
                    Escríbenos por WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Barra inferior */}
          <div
            className="lp-footer-bottom px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          >
            <span>© {new Date().getFullYear()} {NOMBRE_NEGOCIO} · Uruapan, Michoacán · Todos los derechos reservados</span>
            <a href="#top" className="lp-footer-link font-bold">Volver al inicio</a>
          </div>
      </footer>
    </div>
  );
}
