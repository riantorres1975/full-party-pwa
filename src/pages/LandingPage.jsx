import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, MessageCircle, MapPin, Star, Package,
  Sparkles, ArrowRight, Menu, X, Navigation, Clock,
} from 'lucide-react';
import './LandingPage.css';

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
  textHead:   '#2D0D5A',   // Morado muy oscuro — excelente contraste
  textBody:   '#5B3080',   // Morado medio legible
  textMuted:  '#9C6BC6',   // Lavanda suave
};

// ════════════════════════════════════════════════════════════
// 2. CONFIGURACIÓN — env vars y constantes globales
// ════════════════════════════════════════════════════════════
const ENV = {
  waNumber:   import.meta.env.VITE_WHATSAPP_NUMBER  || '521XXXXXXXXXX',
  negocio:    import.meta.env.VITE_NOMBRE_NEGOCIO   || 'Full Party',
  direccion:  import.meta.env.VITE_DIRECCION_TIENDA || 'Uruapan, Michoacán',
  horario:    import.meta.env.VITE_HORARIO_TIENDA   || 'Lun–Sáb 9am–7pm',
  mapsUrl:    import.meta.env.VITE_MAPS_URL_TIENDA  || '#',
};

const WA_HREF  = `https://wa.me/${ENV.waNumber}?text=${encodeURIComponent('Hola, me interesa hacer un pedido por mayoreo 🎉')}`;
const TYPING   = { typeSpeed: 85, eraseSpeed: 48, holdMs: 2400, pauseMs: 380 };
const REVIEW_INTERVAL_MS = 5000;

// ════════════════════════════════════════════════════════════
// 3. DATOS DE CONTENIDO
// ════════════════════════════════════════════════════════════

const BRANCH_NAMES = ['Sol Naciente', 'Francisco Villa'];

// Colores de letras inspirados en el logo (cíclicos por posición)
const LETTER_COLORS = [C.pink, C.purple, C.green, C.orange, C.cyan, C.blue, '#FDE047'];

const NAV_LINKS = [
  { label: 'Inicio',     href: 'top',        hash: false },
  { label: 'Catálogo',   href: '#/catalogo', hash: true  },
  { label: 'Sucursales', href: 'sucursales', hash: false },
  { label: 'Reseñas',    href: 'resenas',    hash: false },
  { label: 'Contacto',   href: 'contacto',   hash: false },
];

const BENEFICIOS = [
  {
    icon:     Star,
    titulo:   'Precios por Mayoreo',
    desc:     'Tarifas escalonadas desde la primera pieza. Entre más compras, más ahorras.',
    color:    C.pink,
    gradient: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
  },
  {
    icon:     MessageCircle,
    titulo:   'Pedidos por WhatsApp',
    desc:     'Genera tu orden desde el catálogo y envíala a nuestro chat. Sin llamadas.',
    color:    C.purple,
    gradient: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
  },
  {
    icon:     MapPin,
    titulo:   'Recolección en Sucursal',
    desc:     'Retira en Centro o Sol Naciente. Envío disponible en Uruapan y zona.',
    color:    C.cyan,
    gradient: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
  },
];

const CATEGORIAS = [
  { emoji: '🎈', titulo: 'Globos y Arreglos',   desc: 'Látex, foil y arreglos personalizados', color: C.pink   },
  { emoji: '🍽️', titulo: 'Vajilla Desechable',  desc: 'Platos, vasos y cubiertos por paquete', color: C.orange },
  { emoji: '🎀', titulo: 'Decoración Temática', desc: 'Sets completos para toda ocasión',       color: C.purple },
  { emoji: '🏷️', titulo: 'Ofertas de Mayoreo',  desc: 'Los mejores precios por volumen',        color: C.green  },
];

const PASOS = [
  { num: '1', icon: ShoppingBag,   titulo: 'Navega',       desc: 'Explora +500 artículos ordenados por categoría.',     color: C.pink   },
  { num: '2', icon: Package,       titulo: 'Al carrito',   desc: 'Agrega productos y ve el total mayoreo en vivo.',      color: C.purple },
  { num: '3', icon: Sparkles,      titulo: 'Revisa',       desc: 'Confirma cantidades y precios escalonados.',           color: C.cyan   },
  { num: '4', icon: MessageCircle, titulo: 'Por WhatsApp', desc: 'Un toque y tu pedido llega listo a nuestro chat.',    color: C.green  },
];

const MARCAS = [
  { nombre: 'Glomex',     desc: 'Artículos de fiesta premium', color: C.pink,   emoji: '🎉' },
  { nombre: 'Decoratexz', desc: 'Decoración y adornos',        color: C.purple, emoji: '🎀' },
  { nombre: 'Sempertex',  desc: 'Globos de látex y foil',      color: C.green,  emoji: '🎈' },
  { nombre: 'Peyma',      desc: 'Vajilla desechable',          color: C.orange, emoji: '🍽️' },
];

const RESENAS = [
  {
    id:       1,
    nombre:   'María González',
    inicial:  'M',
    color:    C.pink,
    texto:    'Excelente atención y variedad de productos para mayoreo. Los precios son inmejorables, muy recomendado para eventos y fiestas de todo tipo.',
    fecha:    'hace 2 semanas',
  },
  {
    id:       2,
    nombre:   'Carlos Mendoza',
    inicial:  'C',
    color:    C.purple,
    texto:    'Pedí para los 15 años de mi hija y todo llegó perfecto. El proceso de pedido por WhatsApp fue muy sencillo y super rápido. 100% recomendado.',
    fecha:    'hace 1 mes',
  },
  {
    id:       3,
    nombre:   'Ana Martínez',
    inicial:  'A',
    color:    C.green,
    texto:    'Gran surtido de globos y decoraciones. Los arreglos quedaron hermosos. Sin duda el mejor lugar para comprar al mayoreo en Uruapan.',
    fecha:    'hace 3 semanas',
  },
  {
    id:       4,
    nombre:   'Roberto Torres',
    inicial:  'R',
    color:    C.orange,
    texto:    'Compro aquí regularmente para mis eventos. La atención es excelente y los productos de muy buena calidad. Siempre hay buen stock.',
    fecha:    'hace 2 meses',
  },
  {
    id:       5,
    nombre:   'Lupita Sánchez',
    inicial:  'L',
    color:    C.cyan,
    texto:    'Muy buena experiencia, precios muy accesibles al mayoreo. El personal es amable y el surtido impresionante. ¡Volveré pronto!',
    fecha:    'hace 1 semana',
  },
];

const SUCURSALES = [
  {
    nombre:   'Centro',
    direccion: ENV.direccion,
    horario:   ENV.horario,
    mapsUrl:   ENV.mapsUrl,
    badge:    'Sucursal Principal',
    color:    C.pink,
  },
  {
    nombre:   'Sol Naciente',
    direccion: 'Col. Sol Naciente, Uruapan, Michoacán',
    horario:   ENV.horario,
    mapsUrl:   '#',
    badge:    'Sucursal Norte',
    color:    C.purple,
  },
];

// Confeti fijo — fuera del componente para evitar recreaciones
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
  { id: 10, top: 30, left: 97, size:  9, color: C.green,   dur: 12, delay: 3.5, shape: 'diamond' },
  { id: 11, top: 65, left: 49, size:  7, color: C.pink,    dur:  8, delay: 0.3, shape: 'square'  },
  { id: 12, top: 18, left: 26, size:  5, color: C.orange,  dur:  6, delay: 1.8, shape: 'circle'  },
  { id: 13, top: 51, left: 69, size: 11, color: C.cyan,    dur:  9, delay: 2.2, shape: 'square'  },
  { id: 14, top: 78, left: 14, size:  6, color: C.blue,    dur: 11, delay: 0.6, shape: 'diamond' },
  { id: 15, top: 42, left: 38, size:  8, color: C.purple,  dur:  7, delay: 1.4, shape: 'circle'  },
  { id: 16, top:  9, left: 73, size:  6, color: C.green,   dur:  9, delay: 3.8, shape: 'square'  },
  { id: 17, top: 88, left: 29, size: 10, color: C.pink,    dur:  8, delay: 0.9, shape: 'diamond' },
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

  return {
    suffix,
    showCursor: phase !== 'hold',
  };
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

/** Tarjeta con borde gradiente (técnica padding-box / border-box) */
function GradCard({ children, gradient, hoverColor = 'rgba(0,0,0,0.1)', className = '' }) {
  return (
    <div
      className={`lp-card ${className}`}
      style={{
        background:      `linear-gradient(white, white) padding-box, ${gradient} border-box`,
        border:           '2px solid transparent',
        borderRadius:    '1rem',
        boxShadow:       '0 2px 12px rgba(0,0,0,0.07)',
        '--hover-shadow': `0 16px 40px ${hoverColor}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 40px ${hoverColor}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
    >
      {children}
    </div>
  );
}

/** Estrellas de calificación */
function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={16} fill={C.yellow} stroke="none" />
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
 * Renderiza cada carácter de `text` con un color diferente del logo,
 * ciclando por LETTER_COLORS según la posición del carácter.
 * Los espacios conservan su ancho con &nbsp;
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

/** Nombre de tienda animado con efecto typewriter y letras multicolor */
function BranchTyper() {
  const { suffix, showCursor } = useTypingCycle(BRANCH_NAMES);

  return (
    <div className="font-display leading-tight text-center select-none">

      {/* Línea 1 — estática "Full Party Suc." letra por letra con color del logo */}
      <div className="text-3xl sm:text-4xl lg:text-5xl">
        <ColorLetters text="Full Party Suc." />
      </div>

      {/* Línea 2 — sufijo animado.
          min-height reserva el espacio aunque suffix esté vacío → evita el salto de layout */}
      <div
        className="flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl mt-1"
        style={{ minHeight: '1.25em' }}
      >
        <span>
          <ColorLetters text={suffix} />
        </span>
        {/* Cursor parpadeante */}
        <span
          className="cursor-blink inline-block rounded-sm self-center ml-0.5"
          style={{
            width:      3,
            height:    '0.8em',
            background: C.pink,
            opacity:    showCursor ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}

/** Carrusel automático de reseñas estilo Google Maps */
function ReviewsCarousel({ resenas }) {
  const [idx,      setIdx]      = useState(0);
  const [animCls,  setAnimCls]  = useState('review-enter');

  const goTo = useCallback((nextIdx) => {
    setAnimCls('review-exit');
    setTimeout(() => {
      setIdx(nextIdx);
      setAnimCls('review-enter');
    }, 320);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      goTo((idx + 1) % resenas.length);
    }, REVIEW_INTERVAL_MS);
    return () => clearInterval(t);
  }, [idx, resenas.length, goTo]);

  const r = resenas[idx];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tarjeta de reseña */}
      <div
        key={r.id}
        className={`${animCls} rounded-3xl p-7 bg-white text-left`}
        style={{ boxShadow: `0 4px 24px ${r.color}22, 0 1px 6px rgba(0,0,0,0.06)`, border: `1.5px solid ${r.color}22` }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${r.color}, ${C.purple})` }}
          >
            {r.inicial}
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm truncate" style={{ color: C.textHead }}>{r.nombre}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating count={5} />
              <span className="text-xs" style={{ color: C.textMuted }}>{r.fecha}</span>
            </div>
          </div>
          {/* Google logo */}
          <div className="ml-auto flex-shrink-0">
            <span className="text-xs font-black tracking-tight" style={{
              background: 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Google</span>
          </div>
        </div>

        {/* Texto */}
        <p className="text-sm leading-relaxed" style={{ color: C.textBody }}>
          "{r.texto}"
        </p>
      </div>

      {/* Dots de navegación */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {resenas.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Reseña ${i + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width:      i === idx ? 20 : 8,
              height:     8,
              background: i === idx ? C.pink : `${C.pink}44`,
            }}
          />
        ))}
      </div>

      {/* Rating global */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <StarRating count={5} />
        <span className="font-black text-sm" style={{ color: C.textHead }}>5.0</span>
        <span className="text-xs" style={{ color: C.textMuted }}>· {resenas.length} reseñas verificadas</span>
      </div>
    </div>
  );
}

/** Tarjeta de marca con efecto gris → color */
function BrandCard({ nombre, desc, color, emoji }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center bg-white lp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border:     `2px solid ${hovered ? color : '#E9DEFF'}`,
        boxShadow:  hovered ? `0 12px 32px ${color}28` : '0 2px 10px rgba(0,0,0,0.05)',
        filter:     hovered ? 'none' : 'grayscale(30%)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform:  hovered ? 'translateY(-5px) scale(1.03)' : 'translateY(0) scale(1)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300"
        style={{ background: hovered ? `${color}18` : '#F5EEFF', border: `2px solid ${hovered ? color : '#E9DEFF'}` }}
      >
        <span style={{ filter: hovered ? 'none' : 'saturate(0.5)' }}>{emoji}</span>
      </div>
      <p className="font-display text-sm transition-colors duration-300" style={{ color: hovered ? C.textHead : '#7A6090' }}>{nombre}</p>
      <p className="text-xs transition-colors duration-300"               style={{ color: hovered ? C.textMuted : '#BBA8D4' }}>{desc}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 6. COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = useCallback((link) => {
    setMenuOpen(false);
    if (link.hash) {
      window.location.hash = link.href;
    } else {
      document.getElementById(link.href)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const irAlCatalogo = useCallback(() => {
    window.location.hash = '#/catalogo';
  }, []);

  return (
    <div id="top" className="relative min-h-screen font-body overflow-x-hidden" style={{ background: C.bgHero }}>

      {/* ── Confetti decorativo ─────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {PARTICLES.map(p => (
          <div
            key={p.id}
            style={{
              position:     'absolute',
              top:          `${p.top}%`,
              left:         `${p.left}%`,
              width:         p.size,
              height:        p.size,
              background:    p.color,
              borderRadius:  p.shape === 'circle' ? '50%' : '2px',
              transform:     p.shape === 'diamond' ? 'rotate(45deg)' : 'none',
              animation:    `floatDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
              filter:       `drop-shadow(0 0 3px ${p.color}99)`,
            }}
          />
        ))}
      </div>

      <div className="relative" style={{ zIndex: 2 }}>

        {/* ══ NAV ════════════════════════════════════════ */}
        <nav
          className="sticky top-0 z-50 bg-white border-b"
          style={{ borderColor: '#EDE0F8', boxShadow: '0 2px 16px rgba(192,132,252,0.1)' }}
        >
          <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <img
                src="/icons/icon-192.png"
                alt={ENV.negocio}
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
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: C.cyan }}>
                  Uruapan
                </span>
              </div>
            </div>

            {/* Links desktop */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <button
                  key={l.label}
                  onClick={() => handleNav(l)}
                  className="lp-nav-link px-4 py-2"
                  style={{ color: C.textBody }}
                >
                  {l.label}
                </button>
              ))}
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white lp-scale-hover"
                style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
              >
                <WaIcon size={13} /> WhatsApp
              </a>
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl"
              style={{ background: '#F5EEFF', color: C.purple }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Menú mobile */}
          {menuOpen && (
            <div className="md:hidden border-t bg-white px-5 py-4 flex flex-col gap-1" style={{ borderColor: '#EDE0F8' }}>
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
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-white"
                style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
              >
                <WaIcon size={14} /> Contactar por WhatsApp
              </a>
            </div>
          )}
        </nav>

        {/* ══ HERO ═══════════════════════════════════════ */}
        <section className="relative px-5 pt-16 pb-28 text-center max-w-4xl mx-auto overflow-visible">
          {/* Globos decorativos */}
          <div className="hidden sm:block absolute left-0  top-12 balloon-sway   pointer-events-none" style={{ zIndex: 0 }}><Balloon color={C.pink}   size={55} rotate={-8} /></div>
          <div className="hidden sm:block absolute left-8  top-32 balloon-sway-r pointer-events-none" style={{ zIndex: 0 }}><Balloon color={C.orange} size={38} rotate={5}  /></div>
          <div className="hidden sm:block absolute right-0 top-8  balloon-sway-r pointer-events-none" style={{ zIndex: 0 }}><Balloon color={C.purple} size={58} rotate={10} /></div>
          <div className="hidden sm:block absolute right-10 top-36 balloon-sway  pointer-events-none" style={{ zIndex: 0 }}><Balloon color={C.cyan}   size={36} rotate={-5} /></div>

          <div className="relative" style={{ zIndex: 1 }}>
            <Reveal>
              <span
                className="inline-flex items-center gap-2 text-xs font-black px-5 py-2 rounded-full mb-8"
                style={{ background: `${C.pink}18`, color: C.pink, border: `1px solid ${C.pink}35` }}
              >
                <Sparkles size={12} />
                Distribuidora Mayoreo · Uruapan, Michoacán
              </span>
            </Reveal>

            {/* Nombre animado de sucursal */}
            <div className="mb-8"><BranchTyper /></div>

            <Reveal delay={0.1}>
              <h1
                className="font-display text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 hero-glow"
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
                Cotiza y ordena los mejores artículos de fiesta al mayoreo.
                Precios escalonados, pedido por WhatsApp en un clic.
              </p>
            </Reveal>

            <Reveal delay={0.26}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={irAlCatalogo}
                  className="btn-pink-pulse flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg text-white lp-scale-hover"
                  style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})` }}
                >
                  <ShoppingBag size={22} /> Ver Catálogo Digital
                </button>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-8 py-5 rounded-2xl font-black text-base bg-white lp-scale-hover"
                  style={{ color: C.purple, border: `2px solid ${C.purple}30`, boxShadow: '0 2px 12px rgba(192,132,252,0.15)' }}
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

        {/* ══ BENEFICIOS ══════════════════════════════════ */}
        <section className="px-5 py-16" style={{ background: C.bgBenefits }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="¿Por qué Full Party?" subtitle="Todo lo que necesitas para hacer tu fiesta un éxito." /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {BENEFICIOS.map(({ icon: Icon, titulo, desc, color, gradient }, i) => (
                <Reveal key={titulo} delay={i * 0.1}>
                  <GradCard gradient={gradient} hoverColor={`${color}22`} className="h-full">
                    <div className="p-6 flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon size={24} style={{ color }} />
                      </div>
                      <h3 className="font-display text-base" style={{ color: C.textHead }}>{titulo}</h3>
                      <p className="text-sm leading-relaxed"           style={{ color: C.textBody }}>{desc}</p>
                    </div>
                  </GradCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CATEGORÍAS ══════════════════════════════════ */}
        <section className="px-5 py-16" style={{ background: C.bgHero }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="Categorías Destacadas" subtitle="Los artículos más solicitados para tus eventos." /></Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIAS.map(({ emoji, titulo, desc, color }, i) => (
                <Reveal key={titulo} delay={i * 0.08}>
                  <button
                    onClick={irAlCatalogo}
                    className="lp-scale-hover w-full rounded-2xl p-5 text-center flex flex-col items-center gap-3 bg-white"
                    style={{ border: `2px solid ${color}22`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}66`; e.currentTarget.style.boxShadow = `0 8px 28px ${color}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                  >
                    <span className="text-4xl">{emoji}</span>
                    <h3 className="font-display text-sm leading-snug" style={{ color: C.textHead }}>{titulo}</h3>
                    <p  className="text-xs leading-snug"              style={{ color: C.textMuted }}>{desc}</p>
                    <span className="text-xs font-black flex items-center gap-1" style={{ color }}>Ver más <ArrowRight size={11} /></span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CÓMO FUNCIONA ═══════════════════════════════ */}
        <section className="px-5 py-16" style={{ background: C.bgSteps }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="¿Cómo funciona?" subtitle="Pedir al mayoreo nunca había sido tan fácil." /></Reveal>

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-4 gap-0 relative">
              <div
                className="absolute top-[38px] left-[13%] right-[13%] h-[2px] rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.cyan}, ${C.green})` }}
              />
              {PASOS.map(({ num, icon: Icon, titulo, desc, color }, i) => (
                <Reveal key={num} delay={i * 0.12}>
                  <div className="flex flex-col items-center text-center px-4">
                    <div
                      className="relative z-10 w-[76px] h-[76px] rounded-full flex items-center justify-center mb-5 bg-white step-icon"
                      style={{ border: `3px solid ${color}`, boxShadow: `0 4px 20px ${color}44` }}
                    >
                      <Icon size={28} style={{ color }} />
                      <span
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-display text-white"
                        style={{ background: color, boxShadow: `0 2px 8px ${color}88` }}
                      >{num}</span>
                    </div>
                    <h3 className="font-display text-sm mb-1.5" style={{ color: C.textHead }}>{titulo}</h3>
                    <p  className="text-xs leading-relaxed"     style={{ color: C.textBody }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-0 relative pl-12">
              <div
                className="absolute left-[18px] top-5 bottom-5 w-[2px] rounded-full"
                style={{ background: `linear-gradient(180deg, ${C.pink}, ${C.purple}, ${C.cyan}, ${C.green})` }}
              />
              {PASOS.map(({ num, icon: Icon, titulo, desc, color }, i) => (
                <Reveal key={num} delay={i * 0.1} direction="left">
                  <div className="flex gap-4 items-start pb-9 relative">
                    <div
                      className="absolute -left-[30px] w-10 h-10 rounded-full flex items-center justify-center z-10 bg-white"
                      style={{ border: `2px solid ${color}`, boxShadow: `0 0 12px ${color}44` }}
                    >
                      <span className="font-display text-sm" style={{ color }}>{num}</span>
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={15} style={{ color }} />
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
        <section className="px-5 py-16" style={{ background: C.bgHero }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="Trabajamos con las Mejores Marcas" subtitle="Distribuidores autorizados de marcas líderes en artículos de fiesta." /></Reveal>
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
                style={{ background: '#F5EEFF', border: `1px solid ${C.purple}18` }}
              >
                {[
                  { label: 'Distribuidores Autorizados', color: C.pink   },
                  { label: 'Productos Originales',       color: C.purple },
                  { label: 'Stock Garantizado',          color: C.cyan   },
                  { label: 'Precios de Mayoreo',         color: C.green  },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5" style={{ color }}>
                    <span>✓</span> {label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ RESEÑAS ═════════════════════════════════════ */}
        <section id="resenas" className="px-5 py-16" style={{ background: C.bgReviews }}>
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

        {/* ══ SUCURSALES ══════════════════════════════════ */}
        <section id="sucursales" className="px-5 py-16" style={{ background: C.bgBranches }}>
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionTitle title="Nuestras Sucursales" subtitle="Visítanos en Uruapan, Michoacán." /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SUCURSALES.map(({ nombre, direccion, horario, mapsUrl, badge, color }, i) => (
                <Reveal key={nombre} delay={i * 0.1} direction={i === 0 ? 'left' : 'right'}>
                  <GradCard
                    gradient={`linear-gradient(135deg, ${color}, ${i === 0 ? C.orange : C.cyan})`}
                    hoverColor={`${color}22`}
                    className="h-full"
                  >
                    <div>
                      <div
                        className="h-28 flex items-center justify-center relative overflow-hidden rounded-t-[14px]"
                        style={{ background: `linear-gradient(135deg, ${color}14, ${color}08)` }}
                      >
                        <div className="absolute w-28 h-28 rounded-full" style={{ border: `1px solid ${color}18` }} />
                        <div className="absolute w-40 h-40 rounded-full" style={{ border: `1px solid ${color}0e` }} />
                        <MapPin size={34} style={{ color, opacity: 0.75 }} />
                        <span
                          className="absolute top-3 left-3 text-xs font-black px-3 py-1 rounded-full"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
                        >{badge}</span>
                      </div>
                      <div className="p-5 flex flex-col gap-3">
                        <h3 className="font-display text-base" style={{ color: C.textHead }}>{ENV.negocio} {nombre}</h3>
                        <p className="flex items-start gap-2 text-sm" style={{ color: C.textBody }}>
                          <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color }} />{direccion}
                        </p>
                        <p className="flex items-center gap-2 text-sm" style={{ color: C.textBody }}>
                          <Clock size={13} style={{ color }} />{horario}
                        </p>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black lp-scale-hover"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}33` }}
                        >
                          <Navigation size={13} /> Ver en Google Maps
                        </a>
                      </div>
                    </div>
                  </GradCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ═══════════════════════════════════ */}
        <section id="contacto" className="px-5 py-16" style={{ background: C.bgBenefits }}>
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <div
                className="rounded-3xl px-8 py-14"
                style={{
                  backgroundImage: `linear-gradient(${C.bgBenefits}, ${C.bgBenefits}), linear-gradient(135deg, ${C.pink}, ${C.purple}, ${C.cyan})`,
                  backgroundOrigin: 'border-box',
                  backgroundClip:   'padding-box, border-box',
                  border:           '2px solid transparent',
                }}
              >
                <div className="text-5xl mb-4">🎉</div>
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
                    <ShoppingBag size={18} /> Explorar Catálogo
                  </button>
                  <a
                    href={WA_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white lp-scale-hover"
                    style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
                  >
                    <WaIcon size={18} /> Contactar por WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════ */}
        <footer className="border-t bg-white px-5 py-8" style={{ borderColor: '#EDE0F8' }}>
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon-192.png" alt={ENV.negocio} className="w-8 h-8 rounded-lg" />
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
            <p className="text-xs text-center" style={{ color: C.textMuted }}>
              © {new Date().getFullYear()} {ENV.negocio} · Uruapan, Michoacán · Todos los derechos reservados
            </p>
            <div className="flex gap-4">
              <button onClick={irAlCatalogo} className="text-xs font-bold transition-colors" style={{ color: C.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = C.pink; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
              >Catálogo</button>
              <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="text-xs font-bold transition-colors" style={{ color: C.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = C.pink; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
              >WhatsApp</a>
            </div>
          </div>
        </footer>
      </div>

      {/* ══ BOTÓN FLOTANTE WHATSAPP ══════════════════════ */}
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-pulse fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full font-black text-sm text-white lp-scale-hover"
        style={{ background: 'linear-gradient(135deg, #25d366, #1aab56)', boxShadow: '0 6px 20px rgba(37,211,102,0.5)' }}
      >
        <WaIcon size={20} />
        <span className="hidden sm:inline">¿Dudas? ¡Escríbenos!</span>
      </a>
    </div>
  );
}
