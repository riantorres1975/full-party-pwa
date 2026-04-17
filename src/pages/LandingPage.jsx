import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, MapPin, Star, Package,
  Sparkles, ArrowRight, Menu, X, Navigation, Clock,
  ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import './LandingPage.css';
import { useProductos } from '../hooks/useProductos';
import OptimizedImage from '../components/OptimizedImage';

// ════════════════════════════════════════════════════════════
// 1. PALETA — colores pasteles festivos del logo Full Party
// ════════════════════════════════════════════════════════════
const C = {
  pink:    '#F472B6',   // Rosa pastel — protagonista
  purple:  '#C084FC',   // Morado suave
  green:   '#34D399',   // Verde menta
  orange:  '#FB923C',   // Naranja cálido
  cyan:    '#22D3EE',   // Turquesa brillante
  blue:    '#818CF8',   // Azul indigo
  yellow:  '#FDE047',   // Amarillo — estrellas
  // Fondos de sección (tintes muy suaves)
  bgHero:     '#FEFAFF',
  bgBenefits: '#FEF3FF',
  bgSteps:    '#F5F3FF',
  bgReviews:  '#FFF5F9',
  bgBranches: '#F0FFFE',
  // Texto
  textHead:  '#2D0D5A',   // Morado muy oscuro — excelente contraste
  textBody:  '#5B3080',   // Morado medio legible
  textMuted: '#7B4FA6',   // Lavanda oscura — WCAG AA sobre fondos claros
  surfaceLavender: '#F5EEFF',
  borderSoft: '#EDE0F8',
  infoBlue: '#0369A1',
  accentDeep: '#7C3AED',
  pinkDeep: '#BE185D',
  shadowLavender: 'rgba(192,132,252,0.1)',
};

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

const WA_HREF  = `https://wa.me/${ENV.waNumber}?text=${encodeURIComponent('Hola, me interesa hacer un pedido por mayoreo 🎉')}`;
const TYPING   = { typeSpeed: 85, eraseSpeed: 48, holdMs: 2400, pauseMs: 380 };
const REVIEW_INTERVAL_MS = 5000;

/** GA4: registra un evento si gtag está disponible */
const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
};

// ════════════════════════════════════════════════════════════
// 3. DATOS DE CONTENIDO
// ════════════════════════════════════════════════════════════

const BRANCH_NAMES = [ENV.suc1.nombre, ENV.suc2.nombre];

// Colores de letras inspirados en el logo (cíclicos por posición)
const LETTER_COLORS = [C.pink, C.purple, C.green, C.orange, C.cyan, C.blue, C.yellow];

// Emojis para la explosión de confeti al cambiar de sucursal
const BURST_EMOJIS = ['🎉', '🎊', '✨', '⭐', '🌟', '🎈', '🎀', '🎁'];

const NAV_LINKS = [
  { label: 'Inicio',        href: 'top',            hash: false },
  { label: 'Catálogo',      href: '/catalogo',      hash: true  },
  { label: 'Destacados',    href: '/destacados',    hash: true  },
  { label: 'Cómo funciona', href: '/como-funciona', hash: true  },
  { label: 'Sucursales',    href: '/sucursales',    hash: true  },
  { label: 'Blog',          href: '/blog',          hash: true  },
  { label: 'FAQ',           href: 'faq',            hash: false },
  { label: 'Contacto',      href: 'contacto',       hash: false },
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
  { emoji: '🎈', titulo: 'Globos de Látex',        desc: 'Glomex, Decoratex y Sempertex. Colores, tamaños y calidad helio',  color: C.pink   },
  { emoji: '🦸', titulo: 'Globos de Personajes',   desc: 'Personajes de moda, graduación y Día de las Madres',               color: C.orange },
  { emoji: '🎀', titulo: 'Cortinas y Guirnaldas',  desc: 'Cortinas de lluvia, guirnaldas y decoraciones para todo evento',   color: C.purple },
  { emoji: '🏷️', titulo: 'Sets y Accesorios',      desc: 'Sets de 5 piezas, velas, brillo, bombas eléctricas y más',         color: C.green  },
];

const PASOS = [
  { num: '1', icon: ShoppingBag,   titulo: 'Navega',       desc: 'Explora +500 artículos: globos, cortinas, guirnaldas, velas y más.',  color: C.pink   },
  { num: '2', icon: Package,       titulo: 'Al carrito',   desc: 'Agrega productos y ve el precio mayoreo actualizado en tiempo real.',  color: C.purple },
  { num: '3', icon: Sparkles,      titulo: 'Revisa',       desc: 'Confirma cantidades, precios escalonados y elige entrega o envío.',    color: C.cyan   },
  { num: '4', icon: MessageCircle, titulo: 'Por WhatsApp', desc: 'Un toque y tu pedido llega listo al +52 452 104 0377. Sin llamadas.',  color: C.green  },
];

const MARCAS = [
  { nombre: 'Glomex',      desc: 'Globos de látex al mayoreo',    color: C.pink,   emoji: '🎈' },
  { nombre: 'Decoratex',   desc: 'Globos de látex y decoración',  color: C.purple, emoji: '🎀' },
  { nombre: 'Sempertex',   desc: 'Calidad premium en látex',      color: C.green,  emoji: '✨' },
  { nombre: 'El Bueno',    desc: 'Globos y artículos de fiesta',  color: C.orange, emoji: '🎊' },
  { nombre: 'Mega Shine',  desc: 'Brillo y accesorios para globos', color: C.cyan, emoji: '💫' },
  { nombre: 'Glow Shine',  desc: 'Acabados brillantes premium',   color: C.blue,   emoji: '⭐' },
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
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/ejemplo_landigpage.jpg',
    cliente: 'Sofía M.',   evento: 'XV Años',     emoji: '🎀', color: C.pink,   accent: C.purple,
  },
  {
    id: 2,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/ejemplo_landigpage.jpg',
    cliente: 'Lupita R.',  evento: 'Cumpleaños',  emoji: '🎂', color: C.orange, accent: C.yellow,
  },
  {
    id: 3,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/ejemplo_landigpage.jpg',
    cliente: 'Ana G.',     evento: 'Baby Shower', emoji: '🍼', color: C.cyan,   accent: C.blue,
  },
  {
    id: 4,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/ejemplo_landigpage.jpg',
    cliente: 'Karen V.',   evento: 'Boda',        emoji: '💍', color: C.purple, accent: C.pink,
  },
  {
    id: 5,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/ejemplo_landigpage.jpg',
    cliente: 'Fernanda L.', evento: 'Graduación', emoji: '🎓', color: C.green,  accent: C.cyan,
  },
  {
    id: 6,
    img: 'https://byvjdsqduapzfhdkdwcw.supabase.co/storage/v1/object/public/productos-imagenes/ejemplo_landigpage.jpg',
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

// ════════════════════════════════════════════════════════════
// 4. HOOKS
// ════════════════════════════════════════════════════════════

/** Typewriter que cicla entre palabras: escribe → pausa → borra → repite */
function useTypingCycle(words, opts = TYPING) {
  const { typeSpeed, eraseSpeed, holdMs, pauseMs } = opts;
  const [suffix, setSuffix] = useState(words[0]);
  const [phase,  setPhase]  = useState('hold');
  const [idx,    setIdx]    = useState(0);

  useEffect(() => {
    let t;
    if (phase === 'hold') {
      t = setTimeout(() => setPhase('erasing'), holdMs);
    } else if (phase === 'erasing') {
      if (suffix.length > 0) {
        t = setTimeout(() => setSuffix(s => s.slice(0, -1)), eraseSpeed);
      } else {
        setIdx(i => (i + 1) % words.length);
        setPhase('pause');
      }
    } else if (phase === 'pause') {
      t = setTimeout(() => setPhase('typing'), pauseMs);
    } else if (phase === 'typing') {
      const target = words[idx];
      if (suffix.length < target.length) {
        t = setTimeout(() => setSuffix(target.slice(0, suffix.length + 1)), typeSpeed);
      } else {
        setPhase('hold');
      }
    }
    return () => clearTimeout(t);
  }, [phase, suffix, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  return { suffix, showCursor: phase !== 'hold' };
}

/** IntersectionObserver para animaciones de entrada al hacer scroll */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ════════════════════════════════════════════════════════════
// 5. COMPONENTES REUTILIZABLES
// ════════════════════════════════════════════════════════════

/** Envuelve hijos con fade-in + slide al entrar en viewport */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useReveal();
  const ty = direction === 'up' ? 28 : direction === 'down' ? -28 : 0;
  const tx = direction === 'left' ? 28 : direction === 'right' ? -28 : 0;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translate(0,0)' : `translate(${tx}px,${ty}px)`,
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/** Tarjeta con borde gradiente — hover gestionado por CSS (var --hover-shadow) */
function GradCard({ children, gradient, hoverColor = 'rgba(0,0,0,0.1)', className = '' }) {
  return (
    <div
      className={`lp-card ${className}`}
      style={{
        background:       `linear-gradient(white, white) padding-box, ${gradient} border-box`,
        border:           '2px solid transparent',
        borderRadius:     '1rem',
        boxShadow:        '0 2px 12px rgba(0,0,0,0.07)',
        '--hover-shadow': `0 16px 40px ${hoverColor}`,
      }}
    >
      {children}
    </div>
  );
}

/** Estrellas de calificación */
function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} de 5 estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={16} fill={C.yellow} stroke="none" aria-hidden="true" />
      ))}
    </div>
  );
}

/** Ícono SVG oficial de WhatsApp */
function WaIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/** Ícono SVG de Facebook */
function FbIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

/** Ícono SVG de TikTok */
function TikTokIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

/** Globo SVG decorativo */
function Balloon({ color, size = 48, rotate = 0 }) {
  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 60 81"
      fill="none"
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <ellipse cx="30" cy="30" rx="22" ry="26" fill={color} opacity="0.85" />
      <ellipse cx="22" cy="22" rx="6"  ry="7"  fill="white" opacity="0.22" />
      <path d="M30 56 Q28 62 32 66 Q28 68 30 74" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.65" />
      <circle cx="30" cy="57" r="2" fill={color} opacity="0.55" />
    </svg>
  );
}

/** Título de sección reutilizable */
function SectionTitle({ title, subtitle }) {
  return (
    <div className="text-center mb-12">
      <h2 className="font-display text-3xl sm:text-4xl mb-2" style={{ color: C.textHead }}>{title}</h2>
      <p className="text-sm" style={{ color: C.textMuted }}>{subtitle}</p>
    </div>
  );
}

/**
 * Cada carácter de `text` con un color diferente del logo,
 * ciclando por LETTER_COLORS según la posición del carácter.
 */
function ColorLetters({ text }) {
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={i}
          style={{ color: char === ' ' ? 'inherit' : LETTER_COLORS[i % LETTER_COLORS.length] }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
}

/** Nombre de tienda animado con efecto typewriter y explosión de confeti */
function BranchTyper() {
  const { suffix, showCursor } = useTypingCycle(BRANCH_NAMES);
  const [burst, setBurst]     = useState([]);
  const prevLenRef            = useRef(0);

  // Dispara confeti cada vez que empieza a escribirse una nueva sucursal
  useEffect(() => {
    if (prevLenRef.current === 0 && suffix.length === 1) {
      const particles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 360;
        const dist  = 55 + (i % 3) * 22;
        return {
          id:    i,
          emoji: BURST_EMOJIS[i],
          bx:    Math.cos((angle * Math.PI) / 180) * dist,
          by:    Math.sin((angle * Math.PI) / 180) * dist - 10,
          br:    i * 45 + 15,
        };
      });
      setBurst(particles);
      const t = setTimeout(() => setBurst([]), 850);
      return () => clearTimeout(t);
    }
    prevLenRef.current = suffix.length;
  }, [suffix.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative font-display leading-tight text-center select-none">

      {/* ── Partículas de confeti ── */}
      {burst.map(p => (
        <span
          key={p.id}
          className="lp-burst-particle absolute pointer-events-none"
          aria-hidden="true"
          style={{
            left:      '50%',
            top:       '40%',
            fontSize:  '1.3rem',
            '--bx':    `${p.bx}px`,
            '--by':    `${p.by}px`,
            '--br':    `${p.br}deg`,
            zIndex:    20,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Línea 1 — "Full Party" grande y estático */}
      <div className="text-5xl sm:text-6xl lg:text-7xl">
        <ColorLetters text="Full Party" />
      </div>

      {/* Línea 2 — "Suc. " fijo + nombre escrito letra a letra */}
      <div
        className="flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl mt-2"
        style={{ minHeight: '1.25em' }}
      >
        <span className="font-display" style={{ color: C.textBody }}>Suc.&nbsp;</span>
        <ColorLetters text={suffix} />
        <span
          className="cursor-blink inline-block rounded-sm self-center ml-0.5"
          style={{ width: 2, height: '0.8em', background: C.pink, opacity: showCursor ? 1 : 0 }}
        />
      </div>
    </div>
  );
}

/** Ítem de FAQ con acordeón */
function FaqItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: `${C.purple}22` }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left flex items-center justify-between py-4 gap-4"
        style={{ color: C.textHead }}
        aria-expanded={open}
      >
        <span className="font-bold text-sm">{pregunta}</span>
        <ChevronDown
          size={16}
          className="lp-faq-chevron flex-shrink-0"
          data-open={String(open)}
          style={{ color: C.pink }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed" style={{ color: C.textBody }}>
          {respuesta}
        </p>
      )}
    </div>
  );
}

/** Carrusel automático de reseñas estilo Google Maps */
function ReviewsCarousel({ resenas }) {
  const [idx,    setIdx]    = useState(0);
  const [animCls, setAnimCls] = useState('review-enter');
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((nextIdx) => {
    setAnimCls('review-exit');
    setTimeout(() => {
      setIdx(nextIdx);
      setAnimCls('review-enter');
    }, 320);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      goTo((idx + 1) % resenas.length);
    }, REVIEW_INTERVAL_MS);
    return () => clearInterval(t);
  }, [idx, resenas.length, goTo, paused]);

  const r = resenas[idx];

  return (
    <div
      className="max-w-2xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="lp-review-stage">
        {/* Tarjeta de reseña activa */}
        <div
          key={r.id}
          className={`${animCls} lp-review-card rounded-3xl p-7 bg-white text-left`}
          style={{ boxShadow: `0 4px 24px ${r.color}22, 0 1px 6px rgba(0,0,0,0.06)`, border: `1.5px solid ${r.color}22` }}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${r.color}, ${C.purple})` }}
              aria-hidden="true"
            >
              {r.inicial}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm truncate" style={{ color: C.textHead }}>{r.nombre}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating count={r.stars} />
                <span className="text-xs" style={{ color: C.textMuted }}>{r.fecha}</span>
              </div>
            </div>
            {/* Google logo */}
            <div className="ml-auto flex-shrink-0">
              <span className="text-xs font-black tracking-tight" style={{
                background:            'linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }} aria-label="Google">Google</span>
            </div>
          </div>

          {/* Texto */}
          <p className="text-sm leading-relaxed" style={{ color: C.textBody }}>
            "{r.texto}"
          </p>
        </div>
      </div>

      {/* Controles: prev · dots · next */}
      <div className="flex items-center justify-center gap-2 mt-5">
        <button
          onClick={() => goTo((idx - 1 + resenas.length) % resenas.length)}
          aria-label="Reseña anterior"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors lp-scale-hover"
          style={{ background: `${C.pink}18`, color: C.pink }}
        >
          <ChevronLeft size={16} />
        </button>

        {resenas.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ver reseña ${i + 1}`}
            aria-current={i === idx ? 'true' : undefined}
            className="transition-all duration-300 rounded-full"
            style={{
              width:      i === idx ? 20 : 8,
              height:     8,
              background: i === idx ? C.pink : `${C.pink}44`,
            }}
          />
        ))}

        <button
          onClick={() => goTo((idx + 1) % resenas.length)}
          aria-label="Siguiente reseña"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors lp-scale-hover"
          style={{ background: `${C.pink}18`, color: C.pink }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Rating global */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <StarRating count={5} />
        <span className="font-black text-sm" style={{ color: C.textHead }}>4.9</span>
        <span className="text-xs" style={{ color: C.textMuted }}>· {resenas.length} reseñas en Google Maps</span>
      </div>
    </div>
  );
}

/** Tarjeta de galería con flotación, zoom e iluminación en CSS puro */
function GaleriaCard({ img, cliente, evento, emoji, color, accent, floatDur = 5, floatDelay = 0 }) {
  return (
    <div
      className="lp-galeria-card"
      style={{
        aspectRatio:    '4/5',
        '--gal-shadow': `0 24px 48px ${color}40`,
      }}
    >
      {/* Envoltorio que recibe la animación de flotación */}
      <div
        className="lp-galeria-float w-full h-full relative"
        style={{
          '--float-dur':   `${floatDur}s`,
          '--float-delay': `${floatDelay}s`,
        }}
      >
        {img ? (
          <img
            src={img}
            alt={`Decoración de ${cliente} — ${evento}`}
            loading="lazy"
          />
        ) : (
          /* Placeholder festivo */
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 select-none"
            style={{ background: `linear-gradient(145deg, ${color}22, ${accent}18)`, border: `2px dashed ${color}44` }}
          >
            <span className="absolute top-3 right-3 text-lg opacity-40" aria-hidden="true">✨</span>
            <span className="absolute bottom-5 left-3 text-lg opacity-30" aria-hidden="true">🎊</span>
            <span className="absolute top-7 left-5 text-sm opacity-25"  aria-hidden="true">⭐</span>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: `${color}20`, border: `2px solid ${color}33` }}
            >
              {emoji}
            </div>
            <p className="font-display text-xs text-center px-3" style={{ color }}>
              Comparte tu fiesta
            </p>
          </div>
        )}

        {/* Overlay con nombre y tipo de evento */}
        <div
          className="lp-galeria-overlay absolute inset-0 flex flex-col justify-end p-4 z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 58%)' }}
        >
          <span
            className="text-xs font-black px-2.5 py-1 rounded-full self-start mb-1.5"
            style={{ background: `${color}CC`, color: 'white' }}
          >
            {evento}
          </span>
          <p className="text-white font-bold text-xs">{cliente}</p>
        </div>
      </div>
    </div>
  );
}

/** Ilustración SVG festiva para el encabezado de la tarjeta de sucursal */
function SucursalIllustration({ color, accent, id }) {
  const gid = `sg-${id}`;
  return (
    <svg
      viewBox="0 0 300 150"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={color}  stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.14" />
        </linearGradient>
      </defs>

      {/* Fondo */}
      <rect width="300" height="150" fill={`url(#${gid})`} />

      {/* Cuerda de guirnalda */}
      <path d="M0,22 Q75,36 150,22 Q225,8 300,22"
        fill="none" stroke={color} strokeWidth="1.4" opacity="0.4" />

      {/* Banderines triangulares */}
      {[12,48,84,120,156,192,228,264].map((x, i) => (
        <polygon
          key={i}
          points={`${x},22 ${x+20},22 ${x+10},40`}
          fill={i % 2 === 0 ? color : accent}
          opacity="0.55"
        />
      ))}

      {/* Globo izquierdo */}
      <ellipse cx="32" cy="95" rx="18" ry="22" fill={color}  opacity="0.38" />
      <ellipse cx="26" cy="87" rx="5"  ry="6"  fill="white"  opacity="0.22" />
      <path d="M32,117 Q30,126 34,130 Q30,132 32,138"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.38" />

      {/* Globo derecho */}
      <ellipse cx="268" cy="90" rx="18" ry="22" fill={accent} opacity="0.38" />
      <ellipse cx="262" cy="82" rx="5"  ry="6"  fill="white"  opacity="0.22" />
      <path d="M268,112 Q266,121 270,125 Q266,127 268,133"
        stroke={accent} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.38" />

      {/* Confeti — círculos */}
      {[
        [65, 55, 5, color, 0.45], [240, 50, 6, accent, 0.4],
        [50, 115, 4, accent, 0.38], [255, 118, 5, color, 0.4],
        [190, 48, 3.5, color, 0.5], [110, 130, 4, accent, 0.35],
      ].map(([x, y, r, c, op], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={op} />
      ))}

      {/* Confeti — rombos */}
      {[
        [85, 105, color, 0.38], [215, 112, accent, 0.35],
        [160, 135, color, 0.3], [280, 60, accent, 0.4],
        [20, 60, color, 0.35],
      ].map(([x, y, c, op], i) => (
        <rect key={i} x={x-5} y={y-5} width="10" height="10"
          fill={c} opacity={op} transform={`rotate(45,${x},${y})`} />
      ))}

      {/* Estrellas */}
      {[[70, 42], [232, 40], [95, 135], [205, 130]].map(([x, y], i) => (
        <text key={i} x={x} y={y} fontSize="13"
          fill={i % 2 === 0 ? color : accent} opacity="0.6" textAnchor="middle">★</text>
      ))}

      {/* Círculo central (fondo del ícono) */}
      <circle cx="150" cy="90" r="36" fill="white" opacity="0.5" />
      <circle cx="150" cy="90" r="26" fill="white" opacity="0.45" />

      {/* Pin de mapa estilizado */}
      <path
        d="M150,68 C139,68 130,77 130,88 C130,103 150,115 150,115 C150,115 170,103 170,88 C170,77 161,68 150,68 Z"
        fill={color} opacity="0.85"
      />
      <circle cx="150" cy="88" r="7" fill="white" opacity="0.95" />
    </svg>
  );
}

/** Tarjeta de marca con efecto gris → color gestionado por estado */
function BrandCard({ nombre, desc, color, emoji }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center bg-white lp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border:      `2px solid ${hovered ? color : '#E9DEFF'}`,
        boxShadow:   hovered ? `0 12px 32px ${color}28` : '0 2px 10px rgba(0,0,0,0.05)',
        filter:      hovered ? 'none' : 'grayscale(30%)',
        transition:  'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform:   hovered ? 'translateY(-5px) scale(1.03)' : 'translateY(0) scale(1)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300"
        style={{ background: hovered ? `${color}18` : C.surfaceLavender, border: `2px solid ${hovered ? color : '#E9DEFF'}` }}
      >
        <span style={{ filter: hovered ? 'none' : 'saturate(0.5)' }}>{emoji}</span>
      </div>
      <p className="font-display text-sm transition-colors duration-300" style={{ color: hovered ? C.textHead : '#7A6090' }}>{nombre}</p>
      <p className="text-xs transition-colors duration-300"              style={{ color: hovered ? C.textMuted : '#BBA8D4' }}>{desc}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 6. CARRUSEL DE NOVEDADES
// ════════════════════════════════════════════════════════════
const MAX_NOVEDADES = 12;
const CARRUSEL_INTERVAL = 3800;
const CARD_GAP = 16;

function NovedadesCarrusel({ novedades }) {
  const containerRef  = useRef(null);
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [paused, setPaused] = useState(false);
  const [cols, setCols]     = useState(4);
  const [cardW, setCardW]   = useState(0);

  // Calcula ancho de card y columnas según el contenedor real
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const c = w >= 1024 ? 4 : w >= 640 ? 3 : 2;
      setCols(c);
      setCardW((w - CARD_GAP * (c - 1)) / c);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Clonamos las primeras `cols` cards al final para el loop infinito
  const items = useMemo(() => [...novedades, ...novedades.slice(0, cols)], [novedades, cols]);
  const realLen = novedades.length;

  const goNext = useCallback(() => {
    setAnimating(true);
    setIdx(i => i + 1);
  }, []);

  const goPrev = useCallback(() => {
    setAnimating(true);
    setIdx(i => Math.max(0, i - 1));
  }, []);

  // Cuando el rail llega a los clones, salta sin transición al índice real
  const handleTransitionEnd = useCallback(() => {
    if (idx >= realLen) {
      setAnimating(false);
      setIdx(idx % realLen);
    }
  }, [idx, realLen]);

  // Re-activa transición tras el salto instantáneo
  useEffect(() => {
    if (!animating) {
      const t = setTimeout(() => setAnimating(true), 30);
      return () => clearTimeout(t);
    }
  }, [animating]);

  // Auto-avance
  useEffect(() => {
    if (paused || realLen <= cols) return;
    const t = setInterval(goNext, CARRUSEL_INTERVAL);
    return () => clearInterval(t);
  }, [paused, realLen, cols, goNext]);

  const translateX = -(idx * (cardW + CARD_GAP));
  const dotIdx     = idx % realLen;

  if (realLen === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Rail deslizante */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex"
          style={{
            gap:       CARD_GAP,
            transform: cardW ? `translateX(${translateX}px)` : 'none',
            transition: animating ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((p, i) => (
            <Link
              key={`${p.id}-${i}`}
              to="/catalogo"
              className="group flex flex-col flex-shrink-0"
              style={{
                width:        cardW || `calc(${100 / cols}% - ${CARD_GAP}px)`,
                borderRadius: '1.25rem',
                background:   'white',
                border:       `2px solid ${C.pink}40`,
                boxShadow:    `0 6px 24px ${C.pink}20, 0 2px 8px ${C.purple}15`,
                transition:   'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease',
                overflow:     'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-7px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 24px 48px ${C.pink}35, 0 8px 20px ${C.purple}25`;
                e.currentTarget.style.borderColor = C.pink;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `0 6px 24px ${C.pink}20, 0 2px 8px ${C.purple}15`;
                e.currentTarget.style.borderColor = `${C.pink}40`;
              }}
            >
              {/* Franja de color arriba */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.cyan})` }} />

              {/* Imagen */}
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  aspectRatio: '1/1',
                  background:  `linear-gradient(145deg, ${C.pink}12 0%, ${C.purple}0e 50%, ${C.cyan}0a 100%)`,
                  padding:     '14px',
                }}
              >
                <OptimizedImage
                  src={p.imagen_url}
                  alt={p.nombre}
                  className="w-full h-full group-hover:scale-108 transition-transform duration-500"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))' }}
                />
                {/* Badge Nuevo */}
                <span
                  className="absolute top-2 left-2 text-[10px] font-black px-2.5 py-1 rounded-full text-white flex items-center gap-1"
                  style={{
                    background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
                    boxShadow:  `0 2px 8px ${C.pink}55`,
                  }}
                >
                  <Sparkles size={9} aria-hidden="true" /> Nuevo
                </span>
                {/* Brillo en hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${C.pink}12, transparent 70%)` }}
                />
              </div>

              {/* Info */}
              <div
                className="p-3 flex flex-col flex-1"
                style={{ borderTop: `1px solid ${C.pink}20` }}
              >
                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: C.purple }}>
                  {p.categoria || 'Artículo'}
                </p>
                <h3 className="font-display text-xs leading-snug flex-1 line-clamp-2" style={{ color: C.textHead }}>
                  {p.nombre}
                </h3>
                <span
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-black group-hover:gap-2 transition-all"
                  style={{ color: C.pink }}
                >
                  Ver en catálogo <ArrowRight size={10} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Controles */}
      {realLen > cols && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button onClick={goPrev} aria-label="Anterior"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'white', color: C.pink, boxShadow: `0 2px 12px ${C.pink}30`, border: `1.5px solid ${C.pink}40` }}>
            <ChevronLeft size={17} />
          </button>

          <div className="flex gap-1.5">
            {novedades.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimating(true); setIdx(i); }}
                aria-label={`Producto ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === dotIdx ? 22 : 7,
                  height:     7,
                  background: i === dotIdx ? `linear-gradient(90deg, ${C.pink}, ${C.purple})` : `${C.pink}40`,
                  boxShadow:  i === dotIdx ? `0 2px 6px ${C.pink}55` : 'none',
                }}
              />
            ))}
          </div>

          <button onClick={goNext} aria-label="Siguiente"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'white', color: C.pink, boxShadow: `0 2px 12px ${C.pink}30`, border: `1.5px solid ${C.pink}40` }}>
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 7. COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { productos } = useProductos();
  const novedades = useMemo(
    () => productos.filter(p => p.es_nuevo === true && p.activo !== false).slice(0, MAX_NOVEDADES),
    [productos],
  );

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

  return (
    <div id="top" className="relative min-h-screen font-body overflow-x-hidden" style={{ background: C.bgHero }}>

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
              animation:   `floatDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
              filter:      `drop-shadow(0 0 3px ${p.color}99)`,
            }}
          />
        ))}
      </div>

      <div className="relative" style={{ zIndex: 2 }}>

        {/* ══ NAV ════════════════════════════════════════ */}
        <nav
          className="sticky top-0 z-50 bg-white border-b"
          style={{ borderColor: C.borderSoft, boxShadow: `0 2px 16px ${C.shadowLavender}` }}
          aria-label="Navegación principal"
        >
          <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
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
                    background:            `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
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
            </div>

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
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white lp-scale-hover whitespace-nowrap"
                style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
                onClick={() => trackEvent('nav_whatsapp_click')}
              >
                <WaIcon size={13} /> WhatsApp
              </a>
            </div>

            {/* Hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl"
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
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setMenuOpen(false); trackEvent('nav_whatsapp_click'); }}
                className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-white"
                style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
              >
                <WaIcon size={14} /> Contactar por WhatsApp
              </a>
            </div>
          )}
        </nav>

        {/* ══ CONTENIDO PRINCIPAL ════════════════════════ */}
        <main id="main-content">

        {/* ══ HERO ═══════════════════════════════════════ */}
        <section
          className="relative px-5 pt-16 pb-28 text-center max-w-4xl mx-auto overflow-visible"
          aria-labelledby="hero-heading"
        >
          {/* Globos decorativos */}
          <div className="hidden sm:block absolute left-0  top-12 balloon-sway   pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.pink}   size={55} rotate={-8} /></div>
          <div className="hidden sm:block absolute left-8  top-32 balloon-sway-r pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.orange} size={38} rotate={5}  /></div>
          <div className="hidden sm:block absolute right-0 top-8  balloon-sway-r pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.purple} size={58} rotate={10} /></div>
          <div className="hidden sm:block absolute right-10 top-36 balloon-sway  pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true"><Balloon color={C.cyan}   size={36} rotate={-5} /></div>

          <div className="relative" style={{ zIndex: 1 }}>
            <Reveal>
              <span
                className="inline-flex items-center gap-2 text-xs font-black px-5 py-2 rounded-full mb-8"
                style={{ background: `${C.pink}18`, color: C.pinkDeep, border: `1px solid ${C.pink}35` }}
              >
                <Sparkles size={12} aria-hidden="true" />
                Distribuidora Mayoreo · Uruapan, Michoacán
              </span>
            </Reveal>

            {/* Nombre animado de sucursal */}
            <div className="mb-8"><BranchTyper /></div>

            <Reveal delay={0.1}>
              <h1
                id="hero-heading"
                className="lp-hero-title font-display text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 hero-glow"
                style={{
                  background:            `linear-gradient(135deg, ${C.pink} 0%, ${C.purple} 50%, ${C.cyan} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                  backgroundClip:       'text',
                  letterSpacing:        '-0.5px',
                }}
              >
                MAYOREO DE<br />ARTÍCULOS<br />PARA FIESTA
              </h1>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: C.textBody }}>
                +500 productos para decoradores, revendedores y organizadores de eventos.
                Globos Glomex, cortinas de lluvia, guirnaldas, velas, sets y más — con precios de mayoreo y envíos a todo México.
              </p>
            </Reveal>

            <Reveal delay={0.26}>
              <div className="w-full max-w-[340px] mx-auto sm:max-w-none flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={irAlCatalogo}
                  className="btn-pink-pulse w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-lg text-white lp-scale-hover"
                  style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
                >
                  <ShoppingBag size={22} aria-hidden="true" /> Ver Catálogo Digital
                </button>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-5 rounded-2xl font-black text-base bg-white lp-scale-hover whitespace-nowrap"
                  style={{ color: C.accentDeep, border: `2px solid ${C.purple}30`, boxShadow: `0 2px 12px ${C.shadowLavender}` }}
                  onClick={() => trackEvent('hero_whatsapp_click')}
                >
                  <WaIcon size={18} /> Escribir al WhatsApp
                </a>
              </div>
            </Reveal>

            {/* Stats */}
            <Reveal delay={0.35}>
              <div className="mt-14 flex flex-wrap justify-center gap-10">
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

        {/* ══ NOVEDADES ═══════════════════════════════════ */}
        {novedades.length > 0 && (
          <section className="lp-below-fold px-5 pt-8 pb-14" style={{ background: C.bgHero }}>
            <div className="max-w-5xl mx-auto">
              <Reveal>
                <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full mb-2"
                      style={{ background: `linear-gradient(135deg, ${C.pink}30, ${C.purple}25)`, color: C.pink, border: `1px solid ${C.pink}33` }}
                    >
                      <Sparkles size={11} aria-hidden="true" /> Recién llegados
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl" style={{ color: C.textHead }}>
                      Novedades
                    </h2>
                  </div>
                  <Link
                    to="/catalogo"
                    className="text-xs font-black flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: C.pink }}
                  >
                    Ver todo el catálogo <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <NovedadesCarrusel novedades={novedades} />
              </Reveal>
            </div>
          </section>
        )}

        {/* ══ BENEFICIOS ══════════════════════════════════ */}
        <section className="lp-below-fold px-5 py-16" style={{ background: C.bgBenefits }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="¿Por qué Full Party?" subtitle="Todo lo que necesitas para hacer tu fiesta un éxito." /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {BENEFICIOS.map(({ icon: Icon, titulo, desc, color, gradient }, i) => (
                <Reveal key={titulo} delay={i * 0.1}>
                  <GradCard gradient={gradient} hoverColor={`${color}22`} className="h-full">
                    <div className="p-6 flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon size={24} style={{ color }} aria-hidden="true" />
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
        <section className="lp-below-fold px-5 py-16" style={{ background: C.bgBenefits }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="Categorías Destacadas" subtitle="Los artículos más solicitados para tus eventos." /></Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIAS.map(({ emoji, titulo, desc, color }, i) => (
                <Reveal key={titulo} delay={i * 0.08}>
                  <button
                    onClick={irAlCatalogo}
                    className="lp-cat-card lp-scale-hover w-full rounded-2xl p-5 text-center flex flex-col items-center gap-3 bg-white"
                    style={{
                      border:              `2px solid ${color}22`,
                      boxShadow:           '0 2px 12px rgba(0,0,0,0.06)',
                      '--cat-border-hover': `${color}66`,
                      '--cat-shadow-hover': `0 8px 28px ${color}22`,
                    }}
                  >
                    <span className="text-4xl" aria-hidden="true">{emoji}</span>
                    <h3 className="font-display text-sm leading-snug" style={{ color: C.textHead }}>{titulo}</h3>
                    <p  className="text-xs leading-snug"              style={{ color: C.textMuted }}>{desc}</p>
                    <span className="text-xs font-black flex items-center gap-1" style={{ color }}>Ver más <ArrowRight size={11} aria-hidden="true" /></span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CÓMO FUNCIONA ═══════════════════════════════ */}
        <section className="lp-below-fold px-5 py-16" style={{ background: C.bgSteps }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="¿Cómo funciona?" subtitle="Pedir al mayoreo nunca había sido tan fácil." /></Reveal>

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-4 gap-0 relative">
              <div
                className="absolute top-[38px] left-[13%] right-[13%] h-[2px] rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.cyan}, ${C.green})` }}
                aria-hidden="true"
              />
              {PASOS.map(({ num, icon: Icon, titulo, desc, color }, i) => (
                <Reveal key={num} delay={i * 0.12}>
                  <div className="flex flex-col items-center text-center px-4">
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
            <div className="md:hidden flex flex-col gap-0 relative">
              <div
                className="absolute left-[19px] top-5 bottom-5 w-[2px] rounded-full"
                style={{ background: `linear-gradient(180deg, ${C.pink}, ${C.purple}, ${C.cyan}, ${C.green})` }}
                aria-hidden="true"
              />
              {PASOS.map(({ num, icon: Icon, titulo, desc, color }, i) => (
                <Reveal key={num} delay={i * 0.1} direction="left">
                  <div className={`grid grid-cols-[40px_minmax(0,1fr)] gap-4 items-start relative ${i === PASOS.length - 1 ? 'pb-0' : 'pb-9'}`}>
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
        <section className="lp-below-fold px-5 py-16" style={{ background: C.bgHero }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="Trabajamos con las Mejores Marcas" subtitle="Distribuidores autorizados de globos de látex y globos de personajes." /></Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {MARCAS.map((m, i) => (
                <Reveal key={m.nombre} delay={i * 0.09}>
                  <BrandCard {...m} />
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2}>
              <div
                className="rounded-2xl px-6 py-4 flex flex-wrap items-center justify-center gap-4 text-xs font-black"
                style={{ background: C.surfaceLavender, border: `1px solid ${C.purple}18` }}
              >
                {[
                  { label: 'Distribuidores Autorizados', color: C.pink   },
                  { label: 'Productos Originales',       color: C.purple },
                  { label: 'Stock Garantizado',          color: C.cyan   },
                  { label: 'Precios de Mayoreo',         color: C.green  },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5" style={{ color }}>
                    <span aria-hidden="true">✓</span> {label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ RESEÑAS ═════════════════════════════════════ */}
        <section id="resenas" className="lp-below-fold px-5 py-16" style={{ background: C.bgReviews }}>
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <SectionTitle
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
        <section className="lp-below-fold px-5 py-16" style={{ background: C.bgHero }}>
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <SectionTitle
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
                className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ background: `${C.pink}10`, border: `1.5px dashed ${C.pink}44` }}
              >
                <div>
                  <p className="font-display text-sm" style={{ color: C.textHead }}>
                    ¿Decoraste con productos Full Party?
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                    Comparte tu foto por WhatsApp y aparece aquí 🎉
                  </p>
                </div>
                <a
                  href={`https://wa.me/${ENV.waNumber}?text=${encodeURIComponent('¡Hola! Quiero compartir la foto de mi decoración con productos Full Party 🎉')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white lp-scale-hover"
                  style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
                  onClick={() => trackEvent('galeria_compartir_click')}
                >
                  <WaIcon size={14} /> Compartir mi foto
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════ */}
        <section id="faq" className="lp-below-fold px-5 py-16" style={{ background: C.bgSteps }}>
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <SectionTitle
                title="Preguntas Frecuentes"
                subtitle="Todo lo que necesitas saber antes de hacer tu primer pedido."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <div
                className="bg-white rounded-3xl px-6 py-2"
                style={{ boxShadow: `0 2px 20px ${C.shadowLavender}`, border: `1px solid ${C.purple}18` }}
              >
                {FAQS.map((faq, i) => (
                  <FaqItem key={i} {...faq} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ SUCURSALES ══════════════════════════════════ */}
        <section id="sucursales" className="lp-below-fold px-5 py-16" style={{ background: C.bgBranches }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="Nuestras Sucursales" subtitle="Visítanos en Uruapan, Michoacán." /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SUCURSALES.map(({ nombre, direccion, horario, mapsUrl, embedUrl, badge, color, accent, facebook }, i) => (
                <Reveal key={nombre} delay={i * 0.1} direction={i === 0 ? 'left' : 'right'}>
                  <GradCard
                    gradient={`linear-gradient(135deg, ${color}, ${accent})`}
                    hoverColor={`${color}22`}
                    className="h-full"
                  >
                    <div>
                      {/* Encabezado con mapa embebido */}
                      <div
                        className="h-40 relative overflow-hidden rounded-t-[14px]"
                        style={{ borderBottom: `1px solid ${color}33` }}
                      >
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
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
                      <div className="p-5 flex flex-col gap-3">
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
                          className="mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black lp-scale-hover"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}33` }}
                          onClick={() => trackEvent('maps_link_click', { sucursal: nombre })}
                        >
                          <Navigation size={13} aria-hidden="true" /> Ver en Google Maps
                        </a>

                        {/* Redes sociales de la sucursal */}
                        {facebook && (
                          <a
                            href={facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black lp-scale-hover"
                            style={{ background: '#1877F214', color: '#1877F2', border: '1px solid #1877F233' }}
                            onClick={() => trackEvent('facebook_click', { sucursal: nombre })}
                          >
                            <FbIcon size={14} /> Facebook
                          </a>
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
        <section id="contacto" className="lp-below-fold px-5 py-16" style={{ background: C.bgBenefits }}>
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <div
                className="rounded-3xl px-8 py-14"
                style={{
                  backgroundImage:  `linear-gradient(${C.bgBenefits}, ${C.bgBenefits}), linear-gradient(135deg, ${C.pink}, ${C.purple}, ${C.cyan})`,
                  backgroundOrigin: 'border-box',
                  backgroundClip:   'padding-box, border-box',
                  border:           '2px solid transparent',
                }}
              >
                <div className="text-5xl mb-4" aria-hidden="true">🎉</div>
                <h2 className="font-display text-3xl sm:text-4xl mb-4" style={{ color: C.textHead }}>¿Listo para ordenar al mayoreo?</h2>
                <p className="text-sm leading-relaxed mb-10 max-w-lg mx-auto" style={{ color: C.textBody }}>
                  Escríbenos por WhatsApp o explora el catálogo. Atención personalizada para distribuidores y organizadores de eventos.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={irAlCatalogo}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white lp-scale-hover"
                    style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, boxShadow: `0 8px 24px ${C.pink}44` }}
                  >
                    <ShoppingBag size={18} aria-hidden="true" /> Explorar Catálogo
                  </button>
                  <a
                    href={WA_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white lp-scale-hover"
                    style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
                    onClick={() => trackEvent('cta_whatsapp_click')}
                  >
                    <WaIcon size={18} /> Contactar por WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        </main>

        {/* ══ FOOTER — 3 columnas ══════════════════════════ */}
        <footer className="lp-below-fold border-t bg-white" style={{ borderColor: C.borderSoft }}>
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
              <p className="text-xs leading-relaxed mb-4" style={{ color: C.textMuted }}>
                Distribuidora de artículos para fiesta en Uruapan, Michoacán. +500 productos al mayoreo y menudeo. Envíos a todo México.
              </p>
              {/* Botones de redes sociales */}
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white lp-scale-hover"
                  style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
                  onClick={() => trackEvent('footer_whatsapp_click')}
                  aria-label="WhatsApp"
                >
                  <WaIcon size={12} /> WhatsApp
                </a>
                {ENV.suc1.facebook && (
                  <a
                    href={ENV.suc1.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white lp-scale-hover"
                    style={{ background: '#1251AE' }}
                    onClick={() => trackEvent('footer_facebook_suc1_click')}
                    aria-label="Facebook Suc. Francisco Villa"
                  >
                    <FbIcon size={12} /> Suc. {ENV.suc1.nombre}
                  </a>
                )}
                {ENV.suc2.facebook && (
                  <a
                    href={ENV.suc2.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white lp-scale-hover"
                    style={{ background: '#1251AE' }}
                    onClick={() => trackEvent('footer_facebook_suc2_click')}
                    aria-label="Facebook Suc. Sol Naciente"
                  >
                    <FbIcon size={12} /> Suc. {ENV.suc2.nombre}
                  </a>
                )}
                {ENV.tiktok && (
                  <a
                    href={ENV.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white lp-scale-hover"
                    style={{ background: '#010101' }}
                    onClick={() => trackEvent('footer_tiktok_click')}
                    aria-label="TikTok"
                  >
                    <TikTokIcon size={12} /> TikTok
                  </a>
                )}
              </div>
            </div>

            {/* Columna 2: Navegación */}
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

            {/* Columna 3: Secciones */}
            <div>
              <h3 className="font-display text-sm mb-4" style={{ color: C.textHead }}>Secciones</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    to="/catalogo"
                    className="text-xs font-bold hover:text-pink-400 transition-colors"
                    style={{ color: C.textMuted }}
                  >
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link
                    to="/destacados"
                    className="text-xs font-bold hover:text-pink-400 transition-colors"
                    style={{ color: C.textMuted }}
                  >
                    Categorías destacadas
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sucursales"
                    className="text-xs font-bold hover:text-pink-400 transition-colors"
                    style={{ color: C.textMuted }}
                  >
                    Sucursales
                  </Link>
                </li>
                <li>
                  <Link
                    to="/como-funciona"
                    className="text-xs font-bold hover:text-pink-400 transition-colors"
                    style={{ color: C.textMuted }}
                  >
                    ¿Cómo hacer un pedido?
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-xs font-bold hover:text-pink-400 transition-colors"
                    style={{ color: C.textMuted }}
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
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
                  <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors font-bold">
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
              <button
                onClick={irAlCatalogo}
                className="font-bold hover:text-pink-400 transition-colors"
              >
                Catálogo
              </button>
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:text-pink-400 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* ══ BOTÓN FLOTANTE WHATSAPP ══════════════════════ */}
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-pulse fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full font-black text-sm text-white lp-scale-hover w-14 h-14 p-0 sm:w-auto sm:h-auto sm:gap-2.5 sm:pl-4 sm:pr-5 sm:py-3.5"
        style={{ background: 'linear-gradient(135deg, #25d366, #1aab56)', boxShadow: '0 6px 20px rgba(37,211,102,0.5)' }}
        aria-label="Contactar por WhatsApp"
        onClick={() => trackEvent('fab_whatsapp_click')}
      >
        <WaIcon size={20} />
        <span className="hidden sm:inline">¿Dudas? ¡Escríbenos!</span>
      </a>
    </div>
  );
}
