import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';

const C = {
  pink:    '#F472B6',
  purple:  '#C084FC',
  green:   '#34D399',
  orange:  '#FB923C',
  cyan:    '#22D3EE',
  blue:    '#818CF8',
  yellow:  '#FDE047',
  textHead:  '#2D0D5A',
  textBody:  '#5B3080',
  textMuted: '#7B4FA6',
  bgHero:     '#FEFAFF',
  bgBenefits: '#FEF3FF',
  borderSoft: '#EDE0F8',
};

const WA_HREF = 'https://wa.me/5214521040377?text=' + encodeURIComponent('Hola, busco un producto específico 🎉');

const CATEGORIAS = [
  {
    slug: 'globos-latex',
    emoji: '🎈',
    titulo: 'Globos de Látex',
    desc: 'Glomex, Decoratex y Sempertex. Colores sólidos, metalizados y fantasía. Calidad helio y tamaños del 5" al 36" para decoración profesional de eventos.',
    color: C.pink,
    accent: C.purple,
  },
  {
    slug: 'globos-foil',
    emoji: '💫',
    titulo: 'Globos Foil y Metalizados',
    desc: 'Globos foil en todas las formas: estrellas, corazones, figuras y tamaños jumbo. Perfectos para arcos, bouquets y centros de mesa.',
    color: C.cyan,
    accent: C.blue,
  },
  {
    slug: 'globos-numeros',
    emoji: '🔢',
    titulo: 'Globos Números y Letras',
    desc: 'Números y letras gigantes foil para cumpleaños, aniversarios y graduaciones. Colores oro, plata, rosa y más.',
    color: C.yellow,
    accent: C.orange,
  },
  {
    slug: 'personajes',
    emoji: '🦸',
    titulo: 'Globos de Personajes',
    desc: 'Personajes de moda para fiestas infantiles: superhéroes, princesas, animales y licencias populares. Renovamos el catálogo cada temporada.',
    color: C.orange,
    accent: C.pink,
  },
  {
    slug: 'cortinas-guirnaldas',
    emoji: '🎀',
    titulo: 'Cortinas y Guirnaldas',
    desc: 'Cortinas de lluvia metalizadas, guirnaldas de papel y tela, flecos decorativos y banners personalizados para todo tipo de evento.',
    color: C.purple,
    accent: C.pink,
  },
  {
    slug: 'sets-accesorios',
    emoji: '🏷️',
    titulo: 'Sets y Accesorios',
    desc: 'Sets de 5 piezas coordinados, bombas eléctricas, infladoras manuales, cinta curly, listones y todo lo necesario para decorar.',
    color: C.green,
    accent: C.cyan,
  },
  {
    slug: 'velas',
    emoji: '🕯️',
    titulo: 'Velas de Cumpleaños',
    desc: 'Velas de números, letras, figuras y velas mágicas para pastel. Variedad de colores y estilos para cumpleaños de todas las edades.',
    color: C.orange,
    accent: C.yellow,
  },
  {
    slug: 'brillo-acabados',
    emoji: '✨',
    titulo: 'Brillo y Acabados',
    desc: 'Mega Shine y Glow Shine: brillo para globos, acabados metalizados y tratamientos premium que dan el toque final a tus decoraciones.',
    color: C.blue,
    accent: C.cyan,
  },
];

export default function Destacados() {
  return (
    <div style={{ background: C.bgHero, color: C.textBody }} className="min-h-screen">
      <main className="max-w-6xl mx-auto px-5 py-12">

        <header className="text-center mb-14">
          <Link
            to="/"
            className="inline-block text-xs font-bold mb-4 hover:underline"
            style={{ color: C.textMuted }}
          >
            ← Volver al inicio
          </Link>
          <h1
            className="font-display text-4xl sm:text-5xl mb-3"
            style={{ color: C.textHead }}
          >
            Categorías Destacadas
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: C.textMuted }}>
            Los artículos más solicitados de Full Party Uruapan. +500 productos al mayoreo y menudeo
            para decoradores, revendedores y organizadores de eventos en todo México.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {CATEGORIAS.map(({ slug, emoji, titulo, desc, color, accent }) => (
            <Link
              key={slug}
              to={`/catalogo/${slug}`}
              className="group rounded-2xl bg-white p-6 shadow-sm transition-transform hover:scale-[1.02] flex flex-col"
              style={{
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${color}, ${accent}) border-box`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl"
                style={{ background: `linear-gradient(135deg, ${color}22, ${accent}22)` }}
                aria-hidden="true"
              >
                {emoji}
              </div>
              <h2 className="font-display text-lg mb-2" style={{ color: C.textHead }}>
                {titulo}
              </h2>
              <p className="text-xs leading-relaxed flex-1" style={{ color: C.textMuted }}>
                {desc}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1 text-xs font-black group-hover:gap-2 transition-all"
                style={{ color }}
              >
                Ver productos <ArrowRight size={12} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>

        <section
          className="rounded-3xl px-6 py-10 sm:px-10 sm:py-14 text-center"
          style={{
            backgroundImage: `linear-gradient(${C.bgBenefits}, ${C.bgBenefits}), linear-gradient(135deg, ${C.pink}, ${C.purple}, ${C.cyan})`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            border: '2px solid transparent',
          }}
        >
          <h2 className="font-display text-2xl sm:text-3xl mb-3" style={{ color: C.textHead }}>
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: C.textBody }}>
            Contamos con +500 productos. Si necesitas algo específico, escríbenos y te ayudamos a encontrarlo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalogo"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, boxShadow: `0 8px 24px ${C.pink}44` }}
            >
              <ShoppingBag size={16} aria-hidden="true" /> Ver Catálogo Completo
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
            >
              <MessageCircle size={16} aria-hidden="true" /> Preguntar por WhatsApp
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
